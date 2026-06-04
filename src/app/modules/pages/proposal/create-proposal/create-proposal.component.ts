import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, finalize, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FuseLoadingService } from '@fuse/services/loading';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import {
    draftFormHasMeaningfulContent,
    parseProposalDraft,
    proposalDraftStorageKey,
    PROPOSAL_DRAFT_VERSION,
    ProposalDraftEnvelope,
    serializeProposalDraft,
} from '../proposal-draft.storage';

@Component({
    standalone: false,
    selector: 'app-create-proposal',
    templateUrl: './create-proposal.component.html',
    styleUrls: ['./create-proposal.component.scss'],
})
export class CreateProposalComponent implements OnInit, OnDestroy {
    /** Organization Mongo `_id` (query `org`). */
    org = '';
    orgID = '';

    // Form field values (synced from form for template char counts)
    projectTitle = '';
    purpose = '';
    goals = '';
    narrative = '';
    timeTable = '';
    amountRequested: number = 0;
    itemizedBudget = '';
    totalProjectCost: number = 0;

    showMessage = false;
    message = '';

    // Draft state
    draftSaved = false;
    hasDraft = false;
    /** True while server draft PATCH is in flight (debounced autosave). */
    draftSaving = false;

    // Referral/sponsor state (signal avoids NG0100 when HTTP resolves during the same CD turn)
    readonly sponsorInfo = signal<{ name: string; code: string } | null>(null);
    manualReferralCode: string = '';
    referralValidating: boolean = false;
    referralError: string = '';

    user: any;
    userId: any;
    userEmail: string;

    groupedForm: FormGroup;

    readonly totalFields = 8;

    /** Mongo `_id` of the server-side draft Proposal (when `org` is in the URL). */
    serverDraftId: string | null = null;

    /** True while create/update proposal HTTP call is in flight. */
    submittingProposal = false;

    /**
     * After a successful submit, hide footer actions until navigation completes
     * (avoids a one-frame flash of enabled buttons when `finalize` clears loading).
     */
    redirectingAfterSubmit = false;

    /** Human-readable org for the header (from proposal or GET /organization/:id). */
    organizationName = '';

    /** Server composer status when editing a DB-backed draft (`draft` | `ready_to_submit`). */
    composerProposalStatus: string | null = null;
    /** Where Cancel / primary back should return (`organization` | `proposals` | `welcome`). */
    returnTo: 'organization' | 'proposals' | 'welcome' = 'proposals';
    private lastOrgForDraft: string | null = null;

    private _destroy$ = new Subject<void>();

    constructor(
        private proposalService: ProposalService,
        private referralCodeService: ReferralCodeService,
        private getOrganizationService: GetOrganizationService,
        private router: Router,
        private route: ActivatedRoute,
        private _cdr: ChangeDetectorRef,
        private _fuseLoadingService: FuseLoadingService,
        private _dialog: MatDialog,
    ) {
        this.initGroupedForm();
    }

    /** HTTP + `switchMap` can finish without a full app CD pass; inputs still trigger CD on focus. */
    private pingComposerView(): void {
        this._cdr.detectChanges();
    }

    ngOnInit(): void {
        window.scrollTo(0, 0);

        this.getUser();
        this.loadSponsorInfo();

        this.route.queryParams.pipe(
            takeUntil(this._destroy$),
            switchMap((query) => {
                const o = query['org'];
                const oid = query['orgID'];
                this.org = o == null ? '' : String(Array.isArray(o) ? o[0] : o);
                this.orgID = oid == null ? '' : String(Array.isArray(oid) ? oid[0] : oid);
                this.syncReturnToFromQuery(query);

                if (!this.org) {
                    this.serverDraftId = null;
                    this.lastOrgForDraft = null;
                    this.organizationName = '';
                    this.composerProposalStatus = null;
                    this.maybeMigrateDraftFromPlaceholder();
                    this.loadDraftFromLocalStorage();
                    return of(null);
                }

                const orgChanged = this.lastOrgForDraft !== this.org;
                this.lastOrgForDraft = this.org;

                if (orgChanged) {
                    this.organizationName = '';
                }

                const rawDraft = query['draft'];
                const draftFromQuery =
                    rawDraft == null || rawDraft === ''
                        ? ''
                        : String(Array.isArray(rawDraft) ? rawDraft[0] : rawDraft);
                const hasDraftMongoId = /^[a-f\d]{24}$/i.test(draftFromQuery);

                /** Open a specific composer row (My proposals / Welcome) — avoids wrong draft when refetching. */
                if (hasDraftMongoId) {
                    this.prefetchOrganizationForComposerHeader();
                    return this.proposalService.getProposalById(draftFromQuery).pipe(
                        tap((doc: any) => {
                            if (!doc) {
                                return;
                            }
                            const docOrg = doc.organization?._id ?? doc.organization;
                            if (
                                this.org &&
                                docOrg != null &&
                                String(docOrg) !== String(this.org)
                            ) {
                                console.warn(
                                    'Draft organization does not match org query param; using API document.',
                                );
                            }
                            this.assignServerDraftIdFromDocument(doc, draftFromQuery);
                            this.applyProposalDocumentToForm(doc);
                            this.migrateLocalDraftToServer();
                        }),
                        catchError((err) => {
                            console.error('Load draft by id failed', err);
                            return this.proposalService.getMyDrafts(this.org).pipe(
                                switchMap((drafts: any[]) => {
                                    const match = drafts?.find(
                                        (d: any) => String(d?._id) === draftFromQuery,
                                    );
                                    if (match) {
                                        return of(match);
                                    }
                                    if (drafts?.length) {
                                        return of(drafts[0]);
                                    }
                                    const blank = {
                                        projectTitle: '',
                                        purpose: '',
                                        goals: '',
                                        narrative: '',
                                        timeTable: '',
                                        amountRequested: 0,
                                        itemizedBudget: '',
                                        totalProjectCost: 0,
                                    };
                                    return this.proposalService.createProposal(
                                        blank,
                                        this.org,
                                        undefined,
                                        { status: 'draft' },
                                    );
                                }),
                                tap((doc: any) => {
                                    this.assignServerDraftIdFromDocument(doc, null);
                                    this.applyProposalDocumentToForm(doc);
                                    this.migrateLocalDraftToServer();
                                }),
                            );
                        }),
                    );
                }

                if (!orgChanged && this.serverDraftId) {
                    if (!this.organizationName?.trim()) {
                        this.prefetchOrganizationForComposerHeader();
                    }
                    return this.proposalService.getProposalById(this.serverDraftId).pipe(
                        tap((doc: any) => {
                            if (doc) {
                                this.applyProposalDocumentToForm(doc);
                            }
                        }),
                        catchError((err) => {
                            console.error('Refetch draft failed', err);
                            return of(null);
                        }),
                    );
                }

                this.serverDraftId = null;
                this.prefetchOrganizationForComposerHeader();

                return this.proposalService.getMyDrafts(this.org).pipe(
                    catchError((err) => {
                        console.warn('getMyDrafts failed; will create a new draft row', err);
                        return of([]);
                    }),
                    switchMap((drafts: any[]) => {
                        if (drafts?.length) {
                            return of(drafts[0]);
                        }
                        const blank = {
                            projectTitle: '',
                            purpose: '',
                            goals: '',
                            narrative: '',
                            timeTable: '',
                            amountRequested: 0,
                            itemizedBudget: '',
                            totalProjectCost: 0,
                        };
                        return this.proposalService.createProposal(blank, this.org, undefined, { status: 'draft' });
                    }),
                    tap((doc: any) => {
                        this.assignServerDraftIdFromDocument(doc, null);
                        this.applyProposalDocumentToForm(doc);
                        this.migrateLocalDraftToServer();
                    }),
                );
            }),
        ).subscribe({
            error: (e) => console.error('Draft bootstrap failed', e),
        });

        // Immediate sync for character counts and clearing messages
        this.groupedForm.valueChanges.pipe(
            takeUntil(this._destroy$)
        ).subscribe((values) => {
            this.syncProperties(values);
            this.showMessage = false;
        });

        // Debounced auto-save
        this.groupedForm.valueChanges.pipe(
            debounceTime(1000),
            takeUntil(this._destroy$)
        ).subscribe(() => {
            this.saveDraft();
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    get completedFields(): number {
        if (!this.groupedForm) { return 0; }
        return Object.keys(this.groupedForm.controls)
            .filter(key => this.groupedForm.get(key).valid).length;
    }

    private get draftKey(): string {
        return proposalDraftStorageKey(this.org);
    }

    /** Normalize API body — some paths expose `id` instead of `_id`. */
    private assignServerDraftIdFromDocument(doc: unknown, fallbackMongoId?: string | null): void {
        if (doc == null || typeof doc !== 'object') {
            const fb = fallbackMongoId?.trim();
            this.serverDraftId = fb ? String(fb) : null;
            return;
        }
        const d = doc as { _id?: unknown; id?: unknown };
        const raw = d._id ?? d.id ?? fallbackMongoId;
        this.serverDraftId =
            raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
    }

    /**
     * If the user typed before `org` arrived in the URL, draft lived under `proposal-draft-new`.
     * Move it to the real org key once we know the Mongo id (same browser; survives overnight).
     */
    private maybeMigrateDraftFromPlaceholder(): void {
        const org = this.org?.trim() ?? '';
        if (!org || org === 'new') {
            return;
        }
        const placeholderKey = proposalDraftStorageKey(null);
        const targetKey = proposalDraftStorageKey(org);
        const stray = localStorage.getItem(placeholderKey);
        if (!stray || localStorage.getItem(targetKey)) {
            return;
        }
        try {
            const parsed = parseProposalDraft(stray);
            const envelope: ProposalDraftEnvelope = {
                v: PROPOSAL_DRAFT_VERSION,
                savedAt: new Date().toISOString(),
                org,
                orgID: this.orgID || parsed.orgID || '',
                form: parsed.form,
            };
            localStorage.setItem(targetKey, serializeProposalDraft(envelope));
            localStorage.removeItem(placeholderKey);
        } catch {
            /* ignore corrupt draft */
        }
    }

    private syncProperties(values: any): void {
        this.projectTitle = values.projectTitle || '';
        this.purpose = values.purpose || '';
        this.goals = values.goals || '';
        this.narrative = values.narrative || '';
        this.timeTable = values.timeTable || '';
        this.amountRequested = values.amountRequested || 0;
        this.itemizedBudget = values.itemizedBudget || '';
        this.totalProjectCost = values.totalProjectCost || 0;
    }

    /** Offline / no-org fallback only. */
    private loadDraftFromLocalStorage(): void {
        const saved = localStorage.getItem(this.draftKey);
        if (!saved) {
            return;
        }
        try {
            const { form } = parseProposalDraft(saved);
            this.groupedForm.patchValue(form, { emitEvent: false });
            this.syncProperties(form);
            this.hasDraft = draftFormHasMeaningfulContent(form);
        } catch (e) {
            console.error('Failed to load draft', e);
        }
    }

    private applyProposalDocumentToForm(doc: any): void {
        if (!doc) {
            return;
        }
        const patch = {
            projectTitle: doc.projectTitle ?? '',
            purpose: doc.purpose ?? '',
            goals: doc.goals ?? '',
            narrative: doc.narrative ?? '',
            timeTable: doc.timeTable ?? '',
            amountRequested: doc.amountRequested ?? 0,
            itemizedBudget: doc.itemizedBudget ?? '',
            totalProjectCost: doc.totalProjectCost ?? 0,
        };
        this.groupedForm.patchValue(patch, { emitEvent: false });
        this.syncProperties(patch);
        this.hasDraft = draftFormHasMeaningfulContent(patch as Record<string, unknown>);
        this.hydrateComposerContextFromDoc(doc);
        this.pingComposerView();
    }

    /** Draft / ready_to_submit label and org name for the page header. */
    private hydrateComposerContextFromDoc(doc: any): void {
        const s = doc?.status;
        this.composerProposalStatus =
            s === 'draft' || s === 'ready_to_submit' ? String(s) : null;

        const orgPop = doc?.organization;
        // POST /proposal often returned `organization` as an ObjectId string; GET /proposal may populate it.
        if (typeof orgPop === 'string' && orgPop.trim()) {
            this.resolveOrganizationHeaderByMongoId(orgPop.trim());
            return;
        }
        if (orgPop && typeof orgPop === 'object') {
            const n = orgPop.name;
            if (typeof n === 'string' && n.trim()) {
                this.organizationName = n.trim();
            }
            const sid = orgPop.organizationID ?? (orgPop as { orgID?: string }).orgID;
            if (!this.orgID && sid != null && String(sid).trim() !== '') {
                this.orgID = String(sid).trim();
            }
            if (this.organizationName) {
                return;
            }
            const oid = orgPop._id;
            if (oid != null && String(oid).trim() !== '') {
                this.resolveOrganizationHeaderByMongoId(String(oid).trim());
                return;
            }
        }

        if (this.organizationName) {
            return;
        }

        const mongoOrgId = this.org?.trim();
        if (mongoOrgId) {
            this.resolveOrganizationHeaderByMongoId(mongoOrgId);
        }
    }

    /** GET /organization/:mongoId for header — skips if name already set from populated proposal.org. */
    private resolveOrganizationHeaderByMongoId(mongoOrgId: string): void {
        if (!mongoOrgId) {
            return;
        }
        this.getOrganizationService
            .getOrg(mongoOrgId)
            .pipe(take(1), takeUntil(this._destroy$))
            .subscribe({
                next: (payload: any) => {
                    this.applyOrganizationPayloadToHeader(payload);
                },
                error: () => {
                    if (this.orgID) {
                        this.organizationName = `Organization (${this.orgID})`;
                    } else if (!this.organizationName?.trim()) {
                        this.organizationName = 'Your organization';
                    }
                    this.pingComposerView();
                },
            });
    }

    /**
     * Org-scoped composer (query `org`): show status + org line as soon as we know the org,
     * not only after `serverDraftId` exists — avoids an empty header for untitled drafts.
     */
    showComposerContext(): boolean {
        return !!this.org?.trim();
    }

    /** Primary + alternate destinations for the composer header back row. */
    composerBackLinks(): { id: string; label: string; path: string[]; fragment?: string }[] {
        const options = [
            {
                id: 'organization' as const,
                label: this.organizationName?.trim() || 'Organization',
                path: ['/pages/organization', this.orgID],
                fragment: 'proposals',
                show: !!this.orgID?.trim(),
            },
            {
                id: 'proposals' as const,
                label: 'My proposals',
                path: ['/pages/proposals'],
                show: true,
            },
            {
                id: 'welcome' as const,
                label: 'Home',
                path: ['/welcome'],
                show: true,
            },
        ].filter((o) => o.show);

        const primary = options.find((o) => o.id === this.returnTo) ?? options[0];
        const rest = options.filter((o) => o.id !== primary.id);
        return [primary, ...rest].map(({ id, label, path, fragment }) => ({ id, label, path, fragment }));
    }

    isPrimaryBackLink(linkId: string): boolean {
        return linkId === this.returnTo;
    }

    private syncReturnToFromQuery(query: Record<string, unknown>): void {
        const raw = query['returnTo'];
        const explicit =
            raw == null || raw === ''
                ? ''
                : String(Array.isArray(raw) ? raw[0] : raw);
        if (explicit === 'organization' || explicit === 'proposals' || explicit === 'welcome') {
            this.returnTo = explicit;
            return;
        }
        this.returnTo = this.orgID?.trim() ? 'organization' : 'proposals';
    }

    private navigateToReturnTo(): void {
        switch (this.returnTo) {
            case 'organization':
                if (this.orgID?.trim()) {
                    this.router.navigate(['/pages/organization', this.orgID], { fragment: 'proposals' });
                } else {
                    this.router.navigate(['/pages/organizations']);
                }
                break;
            case 'welcome':
                this.router.navigate(['/welcome']);
                break;
            case 'proposals':
            default:
                this.router.navigate(['/pages/proposals']);
        }
    }

    composerStatusLabel(): string {
        const id = this.serverDraftId?.trim();
        const st = this.composerProposalStatus;
        // Badge text must not depend on `_id` alone — some responses hydrate the form before `id` lands.
        if (!id && st !== 'draft' && st !== 'ready_to_submit') {
            return 'Loading draft…';
        }
        if (st === 'ready_to_submit') {
            return 'Ready to submit';
        }
        if (st === 'draft') {
            return 'Draft';
        }
        return 'In progress';
    }

    /** Resolve org name (and short `orgID` if missing) for the header before the draft row exists. */
    private prefetchOrganizationForComposerHeader(): void {
        const mongoOrgId = this.org?.trim();
        if (!mongoOrgId) {
            return;
        }
        // Avoid an indefinite "Loading organization…" if GET /organization/:mongoId is slow or errors.
        // Use a neutral label — short code is shown separately as (orgID) in the template.
        if (!this.organizationName?.trim() && this.orgID?.trim()) {
            this.organizationName = 'Your organization';
            this.pingComposerView();
        }
        this.getOrganizationService
            .getOrg(mongoOrgId)
            .pipe(take(1), takeUntil(this._destroy$))
            .subscribe({
                next: (payload: any) => {
                    this.applyOrganizationPayloadToHeader(payload);
                },
                error: () => {
                    if (!this.organizationName && this.orgID) {
                        this.organizationName = `Organization (${this.orgID})`;
                    } else if (!this.organizationName) {
                        this.organizationName = 'Your organization';
                    }
                    this.pingComposerView();
                },
            });
    }

    private applyOrganizationPayloadToHeader(payload: any): void {
        if (payload?.name) {
            this.organizationName = String(payload.name);
        }
        const shortId = payload?.organizationID ?? payload?.orgID;
        if (!this.orgID && shortId != null && String(shortId).trim() !== '') {
            this.orgID = String(shortId).trim();
        }
        if (!this.organizationName && this.orgID) {
            this.organizationName = `Organization (${this.orgID})`;
        }
        this.pingComposerView();
    }

    /** One-time: merge legacy browser draft into the new DB draft row, then drop localStorage. */
    private migrateLocalDraftToServer(): void {
        if (!this.org || !this.serverDraftId) {
            return;
        }
        this.maybeMigrateDraftFromPlaceholder();
        const raw = localStorage.getItem(this.draftKey);
        if (!raw) {
            return;
        }
        try {
            const { form } = parseProposalDraft(raw);
            if (!draftFormHasMeaningfulContent(form)) {
                return;
            }
            this.groupedForm.patchValue(form, { emitEvent: false });
            this.syncProperties(form);
            this.proposalService
                .updateProposal(this.serverDraftId, { ...this.groupedForm.value })
                .subscribe({
                    next: () => localStorage.removeItem(this.draftKey),
                    error: () => {},
                });
        } catch {
            /* ignore */
        }
    }

    saveDraft(): void {
        if (!this.org || !this.serverDraftId) {
            this.saveDraftToLocalStorageFallback();
            return;
        }
        const body = { ...this.groupedForm.value };
        this.draftSaving = true;
        this._cdr.markForCheck();
        this.proposalService
            .updateProposal(this.serverDraftId, body)
            .pipe(
                finalize(() => {
                    this.draftSaving = false;
                    this._cdr.markForCheck();
                })
            )
            .subscribe({
                next: () => {
                    this.hasDraft = draftFormHasMeaningfulContent(this.groupedForm.value);
                    this.draftSaved = true;
                    setTimeout(() => this.draftSaved = false, 2000);
                    this.proposalService
                        .getProposalById(this.serverDraftId!)
                        .pipe(take(1), takeUntil(this._destroy$))
                        .subscribe({
                            next: (doc: any) => {
                                const st = doc?.status;
                                this.composerProposalStatus =
                                    st === 'draft' || st === 'ready_to_submit' ? String(st) : null;
                            },
                            error: () => {},
                        });
                },
                error: () => this.saveDraftToLocalStorageFallback(),
            });
    }

    private saveDraftToLocalStorageFallback(): void {
        const org = this.org?.trim() || '';
        const orgID = this.orgID?.trim() || '';
        const envelope: ProposalDraftEnvelope = {
            v: PROPOSAL_DRAFT_VERSION,
            savedAt: new Date().toISOString(),
            org,
            orgID,
            form: this.groupedForm.value,
        };
        localStorage.setItem(this.draftKey, serializeProposalDraft(envelope));
        this.hasDraft = draftFormHasMeaningfulContent(this.groupedForm.value);
        this.draftSaved = true;
        setTimeout(() => this.draftSaved = false, 2000);
    }

    private clearLocalDraftStorage(): void {
        localStorage.removeItem(this.draftKey);
        localStorage.removeItem(proposalDraftStorageKey(null));
    }

    clearDraft(): void {
        this.groupedForm.reset({
            projectTitle: '',
            purpose: '',
            goals: '',
            narrative: '',
            timeTable: '',
            amountRequested: 0,
            itemizedBudget: '',
            totalProjectCost: 0,
        });
        this.hasDraft = false;
        if (this.serverDraftId && this.org) {
            this.proposalService
                .updateProposal(this.serverDraftId, {
                    projectTitle: '',
                    purpose: '',
                    goals: '',
                    narrative: '',
                    timeTable: '',
                    amountRequested: 0,
                    itemizedBudget: '',
                    totalProjectCost: 0,
                })
                .subscribe({ error: () => {} });
        }
        this.clearLocalDraftStorage();
    }

    initGroupedForm(): void {
        this.groupedForm = new FormGroup({
            projectTitle: new FormControl('', [Validators.required]),
            purpose: new FormControl('', [Validators.required]),
            goals: new FormControl('', [Validators.required]),
            narrative: new FormControl('', [Validators.required]),
            timeTable: new FormControl('', [Validators.required]),
            amountRequested: new FormControl(0, [Validators.required, Validators.min(1)]),
            itemizedBudget: new FormControl('', [Validators.required]),
            totalProjectCost: new FormControl(0, [Validators.required, Validators.min(1)]),
        });
    }

    //retrieve the user from localStorage
    getUser(): void {
        if (localStorage.getItem('currentUser')) {
            this.user = JSON.parse(localStorage.getItem('currentUser'));
            this.userId = this.user.id;
            this.userEmail = this.user.email;
        } else {
            this.router.navigate(['/sign-in']);
        }
    }

    cancel(): void {
        this.navigateToReturnTo();
    }

    loadSponsorInfo(): void {
        this.referralCodeService.getMySponsor().subscribe({
            next: (result) => {
                if (!result?.hasSponsor) {
                    return;
                }
                this.sponsorInfo.set({
                    name: result.sponsor?.name ?? '',
                    code: result.code ?? '',
                });
            },
            error: () => {}
        });
    }

    applyReferralCode(): void {
        const code = this.manualReferralCode.trim();
        if (!code) { return; }

        this.referralValidating = true;
        this.referralError = '';

        this.referralCodeService.setMyReferralCode(code).subscribe({
            next: (result) => {
                this.referralValidating = false;
                this.manualReferralCode = '';
                this.sponsorInfo.set({
                    name: result.sponsor?.name ?? '',
                    code: result.code ?? '',
                });
            },
            error: (err) => {
                this.referralValidating = false;
                this.referralError = err.error?.message || 'Invalid referral code';
            }
        });
    }

    clearSponsor(): void {
        const sponsor = this.sponsorInfo();
        if (!sponsor) {
            return;
        }

        const ref = this._dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Remove sponsor?',
                message: `Remove ${sponsor.name} (${sponsor.code}) as your sponsor? You can re-enter their referral code later if needed.`,
                confirmText: 'Remove',
                cancelText: 'Cancel',
                warn: true,
            },
        });

        ref.afterClosed().pipe(takeUntil(this._destroy$)).subscribe((ok) => {
            if (!ok) {
                return;
            }
            this.referralCodeService.clearMyReferralCode().subscribe();
            this.sponsorInfo.set(null);
        });
    }

    private getActiveReferralCode(): string | undefined {
        const sponsor = this.sponsorInfo();
        if (sponsor?.code) {
            return sponsor.code;
        }

        // Fall back to localStorage for backwards compatibility
        const stored = localStorage.getItem('referralCode');
        if (!stored) { return undefined; }

        try {
            const refData = JSON.parse(stored);
            if (refData.year === new Date().getFullYear()) {
                return refData.code;
            }
            localStorage.removeItem('referralCode');
            return undefined;
        } catch {
            localStorage.removeItem('referralCode');
            return stored;
        }
    }

    createProposal(): void {
        this.groupedForm.markAllAsTouched();

        if (!this.groupedForm.valid) {
            return;
        }

        const proposalObj = this.groupedForm.value;
        const referralCode = this.getActiveReferralCode();

        if (this.serverDraftId) {
            const body: Record<string, unknown> = {
                ...proposalObj,
                status: 'submitted',
            };
            if (referralCode) {
                body['referralCode'] = referralCode;
            }
            this.runProposalSubmit(
                this.proposalService.updateProposal(this.serverDraftId, body),
                (res: any) => {
                    const pid = res?.proposal?.proposalID ?? res?.proposal?.proposalId;
                    this.clearLocalDraftStorage();
                    this.serverDraftId = null;
                    this.router.navigate([`/pages/proposal/${pid}`]);
                },
                'Could not submit proposal',
            );
            return;
        }

        this.runProposalSubmit(
            this.proposalService.createProposal(proposalObj, this.org, referralCode),
            (result: { proposalID?: string }) => {
                this.clearLocalDraftStorage();
                this.router.navigate([`/pages/proposal/${result.proposalID}`]);
            },
            'Could not create proposal',
        );
    }

    private runProposalSubmit(
        obs: Observable<unknown>,
        onSuccess: (res: unknown) => void,
        failureMessage: string,
    ): void {
        this.submittingProposal = true;
        this.redirectingAfterSubmit = false;
        this._fuseLoadingService.show();
        obs.pipe(
            takeUntil(this._destroy$),
            finalize(() => {
                if (!this.redirectingAfterSubmit) {
                    this.submittingProposal = false;
                }
            }),
        ).subscribe({
            next: (res) => {
                this.redirectingAfterSubmit = true;
                onSuccess(res);
            },
            error: (err: { error?: { message?: string } }) => {
                this._fuseLoadingService.hide();
                this.message = err.error?.message ?? failureMessage;
                this.showMessage = true;
                setTimeout(() => {
                    this.showMessage = false;
                }, 3000);
            },
        });
    }
}
