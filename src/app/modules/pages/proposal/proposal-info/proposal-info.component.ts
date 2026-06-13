import {
    ChangeDetectorRef,
    Component,
    OnChanges,
    OnDestroy,
    OnInit,
    EventEmitter,
    Output,
    Input,
    SimpleChanges,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';

@Component({
    standalone: false,
    selector: 'app-proposal-info',
    templateUrl: './proposal-info.component.html',
    styleUrls: ['./proposal-info.component.scss'],
})
export class ProposalInfoComponent implements OnInit, OnDestroy, OnChanges {
    @Output() refreshProp = new EventEmitter<boolean>();
    @Input() isDirector: any;
    @Input() inOrg: any;

    proposalID: string;
    propID: string;
    proposal: any;
    orgID: string;

    public mode: 'view' | 'edit' = 'view';

    apiUrl = environment.apiUrl;

    public groupedForm: FormGroup;

    public propObj: any;

    loaded = false;

    showMessage = false;

    message: any;

    canSave = true;

    editing = false;

    directorEditing = false;

    /** Referral / sponsor code entry (org members editing an existing proposal). */
    manualReferralCode = '';
    referralValidating = false;
    referralError = '';
    referralSuccess = '';

    public projectTitleControl: FormControl;
    public purposeControl: FormControl;
    public goalsControl: FormControl;
    public narrativeControl: FormControl;
    public timeTableControl: FormControl;
    public amountRequestedControl: FormControl;
    public totalProjectCostControl: FormControl;
    public itemizedBudgetControl: FormControl;

    public invalidInputProjectTitle = false;
    public invalidInputPurpose = false;
    public invalidInputGoals = false;
    public invalidInputNarrative = false;
    public invalidInputTimeTable = false;
    public invalidInputAmountRequested = false;
    public invalidInputTotalProjectCost = false;
    public invalidInputItemizedBudget = false;

    private readonly _unsubscribeAll = new Subject<void>();
    private formMessageSub?: Subscription;

    /** Inline + grouped saves can overlap (e.g. fast field commits). */
    private proposalInfoSaveInflight = 0;
    proposalInfoSaving = false;
    proposalInfoSavedFlash = false;
    private proposalInfoSavedTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private _proposalService: ProposalService,
        private _router: Router,
        private route: ActivatedRoute,
        private _cdr: ChangeDetectorRef,
        private _snackBar: MatSnackBar,
        private _dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe((pm) => {
            const id = pm.get('id');
            if (!id) {
                return;
            }
            this.proposalID = id;
            this.getProposal(id);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['inOrg'] || changes['isDirector']) {
            this._cdr.detectChanges();
        }
    }

    ngOnDestroy(): void {
        this.formMessageSub?.unsubscribe();
        this.clearProposalInfoSavedTimer();
        this._unsubscribeAll.next(undefined);
        this._unsubscribeAll.complete();
    }

    private clearProposalInfoSavedTimer(): void {
        if (this.proposalInfoSavedTimer !== null) {
            clearTimeout(this.proposalInfoSavedTimer);
            this.proposalInfoSavedTimer = null;
        }
    }

    private beginProposalInfoSave(): void {
        this.proposalInfoSaveInflight++;
        this.proposalInfoSaving = true;
        this._cdr.markForCheck();
    }

    private endProposalInfoSave(): void {
        this.proposalInfoSaveInflight = Math.max(0, this.proposalInfoSaveInflight - 1);
        this.proposalInfoSaving = this.proposalInfoSaveInflight > 0;
        this._cdr.markForCheck();
    }

    private flashProposalInfoSaved(): void {
        this.clearProposalInfoSavedTimer();
        this.proposalInfoSavedFlash = true;
        this._cdr.markForCheck();
        this.proposalInfoSavedTimer = setTimeout(() => {
            this.proposalInfoSavedFlash = false;
            this.proposalInfoSavedTimer = null;
            this._cdr.markForCheck();
        }, 2000);
    }

    private num(v: unknown, fallback = 0): number {
        if (v === '' || v === null || v === undefined) {
            return fallback;
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    private wireFormMessageClear(): void {
        this.formMessageSub?.unsubscribe();
        this.formMessageSub = this.groupedForm.valueChanges.subscribe(() => {
            this.showMessage = false;
        });
    }

    getProposal(proposalID: string): void {
        this._proposalService.getProposalByID(proposalID).subscribe(
            (proposal) => {
                if (proposal) {
                    this.proposal = proposal;
                    this.propID = this.proposal._id;
                    const org = this.proposal.organization;
                    this.orgID =
                        typeof org === 'object' && org
                            ? org._id
                            : org;
                    this.setFields();
                    this.loaded = true;
                    this._cdr.detectChanges();
                    Promise.resolve().then(() => this._cdr.detectChanges());
                } else {
                    this._router.navigate(['/welcome']);
                }
            },
            () => {}
        );
    }

    setFields(): void {
        if (this.proposal) {
            this.propObj = {
                projectTitle: this.proposal.projectTitle ?? '',
                purpose: this.proposal.purpose ?? '',
                goals: this.proposal.goals ?? '',
                narrative: this.proposal.narrative ?? '',
                timeTable: this.proposal.timeTable ?? '',
                amountRequested: this.proposal.amountRequested ?? 0,
                totalProjectCost: this.proposal.totalProjectCost ?? 0,
                itemizedBudget: this.proposal.itemizedBudget ?? '',
            };
        } else {
            this.propObj = {
                projectTitle: '',
                purpose: '',
                goals: '',
                narrative: '',
                timeTable: '',
                amountRequested: 0,
                totalProjectCost: 0,
                itemizedBudget: '',
            };
        }

        this.initGroupedForm();
        this._cdr.detectChanges();
    }

    resetFormValues(): void {
        this.initGroupedForm();
    }

    initGroupedForm(): void {
        const req = Validators.required;
        const p = this.propObj;

        this.groupedForm = new FormGroup({
            projectTitle: new FormControl(p.projectTitle, req),
            purpose: new FormControl(p.purpose, req),
            goals: new FormControl(p.goals, req),
            narrative: new FormControl(p.narrative, req),
            timeTable: new FormControl(p.timeTable, req),
            amountRequested: new FormControl(p.amountRequested, [req, Validators.min(1)]),
            totalProjectCost: new FormControl(p.totalProjectCost, [req, Validators.min(1)]),
            itemizedBudget: new FormControl(p.itemizedBudget, req),
        });

        this.initFormControls();
        this.wireFormMessageClear();
    }

    initFormControls(): void {
        const p = this.propObj;
        this.projectTitleControl = new FormControl(p.projectTitle);
        this.purposeControl = new FormControl(p.purpose);
        this.goalsControl = new FormControl(p.goals);
        this.narrativeControl = new FormControl(p.narrative);
        this.timeTableControl = new FormControl(p.timeTable);
        this.amountRequestedControl = new FormControl(p.amountRequested);
        this.totalProjectCostControl = new FormControl(p.totalProjectCost);
        this.itemizedBudgetControl = new FormControl(p.itemizedBudget);
    }

    updateSingleField(prop: string, control: string): void {
        const c = this[control] as FormControl;
        if (c.value === '' || c.value === null) {
            c.setValue(this.propObj[prop]);
            this.checkInvalidProp(prop, true);
            setTimeout(() => this.checkInvalidProp(prop, false), 2000);
        } else {
            let val: any = c.value;
            if (prop === 'amountRequested' || prop === 'totalProjectCost') {
                val = this.num(val);
            }
            this.propObj[prop] = val;
            this.saveSingleField({ [prop]: val });
        }
    }

    checkInvalidProp(prop: string, flag: boolean): void {
        switch (prop) {
            case 'projectTitle':
                this.invalidInputProjectTitle = flag;
                break;
            case 'purpose':
                this.invalidInputPurpose = flag;
                break;
            case 'goals':
                this.invalidInputGoals = flag;
                break;
            case 'narrative':
                this.invalidInputNarrative = flag;
                break;
            case 'timeTable':
                this.invalidInputTimeTable = flag;
                break;
            case 'amountRequested':
                this.invalidInputAmountRequested = flag;
                break;
            case 'totalProjectCost':
                this.invalidInputTotalProjectCost = flag;
                break;
            case 'itemizedBudget':
                this.invalidInputItemizedBudget = flag;
                break;
            default:
                console.error('invalid switch prop');
        }
    }

    saveSingleField(change: Record<string, unknown>): void {
        this.updateProposal(change);
    }

    cancelSingleField(prop: string, control: string): void {
        (this[control] as AbstractControl).setValue(this.propObj[prop]);
    }

    updateProposal(body: Record<string, unknown>): void {
        this.beginProposalInfoSave();
        this._proposalService
            .updateProposal(this.propID, body)
            .pipe(finalize(() => this.endProposalInfoSave()))
            .subscribe({
                next: (result) => {
                    this.proposal = result.proposal ?? result;
                    this.setFields();
                    this.refreshProp.emit(true);
                    this.flashProposalInfoSaved();
                },
                error: () => {},
            });
    }

    updateGroupedEdition(): void {
        const v = this.groupedForm.getRawValue();
        this.updateProposal({
            projectTitle: v.projectTitle ?? '',
            purpose: v.purpose ?? '',
            goals: v.goals ?? '',
            narrative: v.narrative ?? '',
            timeTable: v.timeTable ?? '',
            amountRequested: this.num(v.amountRequested),
            totalProjectCost: this.num(v.totalProjectCost),
            itemizedBudget: v.itemizedBudget ?? '',
            organization: this.orgID,
        });
    }

    cancelGroupedEdition(): void {
        this.setFields();
    }

    mainCancel(): void {
        this.editing = false;
        this.getProposal(this.proposalID);
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        this.mode = mode;
        this.resetFormValues();
        this.editing = mode === 'edit';
    }


    handleInlineEnter(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'TEXTAREA') {
            return;
        }
        if (this.mode !== 'edit' || !this.groupedForm?.valid) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.updateGroupedEdition();
    }

    toggleDirectorEdit(): void {
        this.directorEditing = !this.directorEditing;
        this.mode = 'view';
        this.checkEditing(this.mode);
    }

    checkEditing(mode: string): void {
        this.editing = mode !== 'view';
    }

    get hasProposalSponsor(): boolean {
        return !!this.proposal?.sponsor;
    }

    get sponsorDisplayName(): string {
        const sponsor = this.proposal?.sponsor;
        if (!sponsor || typeof sponsor !== 'object') {
            return '';
        }
        const full = `${sponsor.firstName || ''} ${sponsor.lastName || ''}`.trim();
        return full || sponsor.email || '';
    }

    onReferralCodeInput(): void {
        this.referralError = '';
        this.referralSuccess = '';
    }

    applyReferralCode(): void {
        const code = this.manualReferralCode.trim();
        const proposalId = this.resolveProposalMongoId();

        if (!code) {
            return;
        }

        if (!proposalId) {
            this.referralError = 'Proposal is still loading. Please try again in a moment.';
            this._snackBar.open(this.referralError, 'OK', { duration: 4000 });
            this._cdr.detectChanges();
            return;
        }

        this.referralValidating = true;
        this.referralError = '';
        this.referralSuccess = '';

        this._proposalService
            .updateProposal(proposalId, { referralCode: code })
            .pipe(
                finalize(() => {
                    this.referralValidating = false;
                    this._cdr.detectChanges();
                }),
            )
            .subscribe({
                next: (result) => {
                    this.proposal = result.proposal ?? result;
                    this.propID = this.resolveProposalMongoId() ?? proposalId;
                    this.manualReferralCode = '';
                    const sponsorName = this.sponsorDisplayName || 'Director assigned';
                    this.referralSuccess = `Sponsor added: ${sponsorName}`;
                    this._snackBar.open(this.referralSuccess, 'OK', { duration: 5000 });
                    this.refreshProp.emit(true);
                    this._cdr.detectChanges();
                },
                error: (err) => {
                    this.referralError = this.formatReferralError(err);
                    this._snackBar.open(this.referralError, 'OK', { duration: 5000 });
                    this._cdr.detectChanges();
                },
            });
    }

    clearSponsor(): void {
        if (!this.hasProposalSponsor) {
            return;
        }

        const sponsorName = this.sponsorDisplayName || 'this sponsor';
        const ref = this._dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Remove sponsor?',
                message: `Remove ${sponsorName} as the sponsor for this proposal? You can enter a referral code again later if needed.`,
                confirmText: 'Remove',
                cancelText: 'Cancel',
                warn: true,
            },
        });

        ref.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe((ok) => {
            if (!ok) {
                return;
            }

            const proposalId = this.resolveProposalMongoId();
            if (!proposalId) {
                this.referralError = 'Proposal is still loading. Please try again in a moment.';
                this._snackBar.open(this.referralError, 'OK', { duration: 4000 });
                this._cdr.detectChanges();
                return;
            }

            this.referralValidating = true;
            this.referralError = '';
            this.referralSuccess = '';

            this._proposalService
                .updateProposal(proposalId, { clearSponsor: true })
                .pipe(
                    finalize(() => {
                        this.referralValidating = false;
                        this._cdr.detectChanges();
                    }),
                )
                .subscribe({
                    next: (result) => {
                        this.proposal = result.proposal ?? result;
                        this.propID = this.resolveProposalMongoId() ?? proposalId;
                        this.referralSuccess = 'Sponsor removed.';
                        this._snackBar.open(this.referralSuccess, 'OK', { duration: 4000 });
                        this.refreshProp.emit(true);
                        this._cdr.detectChanges();
                    },
                    error: (err) => {
                        this.referralError = this.formatReferralError(err);
                        this._snackBar.open(this.referralError, 'OK', { duration: 5000 });
                        this._cdr.detectChanges();
                    },
                });
        });
    }

    private resolveProposalMongoId(): string | null {
        const raw = this.propID ?? this.proposal?._id ?? this.proposal?.id;
        if (raw == null) {
            return null;
        }
        const id = String(raw);
        return /^[a-f0-9]{24}$/i.test(id) ? id : null;
    }

    private formatReferralError(err: unknown): string {
        const e = err as HttpErrorResponse;
        if (e?.error?.message) {
            return e.error.message;
        }
        if (e?.status === 404) {
            return 'Invalid or expired referral code.';
        }
        if (e?.status === 409) {
            return 'This proposal already has a sponsor.';
        }
        if (e?.status === 400) {
            return e.error?.message || 'Unable to update sponsor.';
        }
        if (e?.status === 403) {
            return 'You do not have permission to add a sponsor to this proposal.';
        }
        if (e?.status === 0) {
            return 'Could not reach the server. Check your connection and try again.';
        }
        return 'Unable to apply referral code. Please try again.';
    }
}
