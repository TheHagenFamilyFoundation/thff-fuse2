import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, take, timeout } from 'rxjs/operators';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { environment } from 'environments/environment';
/** Max wait for submission-year and my-proposals calls before showing an error (avoids hanging forever). */
const API_WAIT_MS = 12000;

@Component({
    standalone: false,
    selector     : 'welcome',
    templateUrl  : './welcome.component.html',
    styleUrls    : ['./welcome.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WelcomeComponent implements OnInit, OnDestroy
{
    /** Shown on welcome when not production — helps when the app is stuck waiting for localhost API */
    readonly showDevApiHint = !environment.production;
    /** Human-readable backend target for dev hints (proxy maps `/api` → this origin) */
    readonly backendOriginLabel: string =
        (environment as { backendOriginLabel?: string }).backendOriginLabel ?? environment.apiUrl;

    latestSubmissionYear: any;
    portalOpen: boolean = false;
    loading: boolean = true;

    proposals: any[] = [];
    proposalsLoading: boolean = false;


    /** Fallback if the HTTP stream never terminates (should not happen with timeout + take). */
    private _grantCycleSafetyTimer: ReturnType<typeof setTimeout> | null = null;
    private _destroyed = false;

    constructor(
        private _submissionYearsService: SubmissionYearsService,
        private _proposalService: ProposalService,
        private _router: Router,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.getLatestSubmissionYear();
    }

    /** In-progress composer proposals (`draft` incomplete or `ready_to_submit` all fields filled). */
    get draftProposals(): any[] {
        return (this.proposals || []).filter((p) => this._isComposerProposal(p));
    }

    /** Submitted proposals only (composer rows are listed above). */
    get submittedProposals(): any[] {
        return (this.proposals || []).filter((p) => !this._isComposerProposal(p));
    }

    /** Hide the “All my proposals” toolbar when there is nothing for the active grant year. */
    get showWelcomeProposalsActionBar(): boolean {
        if (!this.latestSubmissionYear || this.proposalsLoading) {
            return false;
        }
        return this.draftProposals.length > 0 || this.submittedProposals.length > 0;
    }

    /** Hide the “{year} Proposals” section title when there are no submitted rows (empty state stays). */
    get showWelcomeSubmittedSectionHeading(): boolean {
        if (!this.latestSubmissionYear) {
            return false;
        }
        if (this.proposalsLoading) {
            return true;
        }
        return this.submittedProposals.length > 0;
    }

    private _isComposerProposal(p: any): boolean {
        const s = p?.status;
        return s === 'draft' || s === 'ready_to_submit';
    }

    ngOnDestroy(): void {
        this._destroyed = true;
        this._clearGrantCycleSafetyTimer();
    }

    private _clearGrantCycleSafetyTimer(): void {
        if (this._grantCycleSafetyTimer !== null) {
            clearTimeout(this._grantCycleSafetyTimer);
            this._grantCycleSafetyTimer = null;
        }
    }

    private _endGrantCycleLoading(): void {
        if (this._destroyed) {
            return;
        }
        this.loading = false;
        this._clearGrantCycleSafetyTimer();
        this._cdr.detectChanges();
    }

    getLatestSubmissionYear(): void {
        this.loading = true;
        this._clearGrantCycleSafetyTimer();
        this._grantCycleSafetyTimer = setTimeout(() => {
            if (this.loading) {
                console.warn('Welcome: grant-cycle request exceeded safety window; clearing loading state.');
                this._endGrantCycleLoading();
            }
        }, API_WAIT_MS + 3000);

        this._submissionYearsService
            .getLatestSubmissionYear()
            .pipe(
                // First response only — avoids odd multi-emission streams
                take(1),
                // Explicit "first value" deadline (passing a number alone maps to `each`, not `first`)
                timeout({ first: API_WAIT_MS }),
                catchError((err) => {
                    console.error('getLatestSubmissionYear - err', err);
                    return of(null);
                }),
                finalize(() => {
                    this._endGrantCycleLoading();
                })
            )
            .subscribe((year) => {
                this.latestSubmissionYear = year;
                this.portalOpen = !!year?.active;
                if (year) {
                    this.loadMyProposals(year.year);
                } else {
                    this.proposals = [];
                    this.proposalsLoading = false;
                }
            });
    }

    loadMyProposals(year: number): void {
        this.proposalsLoading = true;
        this._proposalService
            .getMyProposals(year)
            .pipe(
                take(1),
                timeout({ first: API_WAIT_MS }),
                catchError((err) => {
                    console.error('loadMyProposals - err', err);
                    return of([]);
                }),
                finalize(() => {
                    this.proposalsLoading = false;
                    this._cdr.markForCheck();
                })
            )
            .subscribe((proposals) => {
                this.proposals = proposals || [];
            });
    }

    /** Org label for draft cards (API populates `organization` on my-proposals). */
    draftOrganizationLabel(draft: any): string {
        const o = draft?.organization;
        if (!o || typeof o !== 'object') {
            return '';
        }
        const name = o.name ? String(o.name).trim() : '';
        const shortId = o.organizationID ? String(o.organizationID).trim() : '';
        if (name && shortId) {
            return `${name} · ${shortId}`;
        }
        if (name) {
            return name;
        }
        if (shortId) {
            return `Organization ${shortId}`;
        }
        return '';
    }

    draftSavedHint(iso: string | undefined): string {
        if (!iso) {
            return '';
        }
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) {
                return '';
            }
            return `Saved ${d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
        } catch {
            return '';
        }
    }

    getProposalStatus(proposal: any): { label: string; color: string; icon: string } {
        if (proposal.status === 'draft') {
            return { label: 'Draft', color: 'text-amber-600 dark:text-amber-400', icon: 'edit_note' };
        }
        if (proposal.status === 'ready_to_submit') {
            return { label: 'Ready to submit', color: 'text-teal-600 dark:text-teal-400', icon: 'task_alt' };
        }
        if (proposal.sponsor) {
            return { label: 'Sponsored', color: 'text-green-600 dark:text-green-400', icon: 'check_circle' };
        }
        if (proposal.votes?.length > 0) {
            return { label: 'Under Review', color: 'text-blue-600 dark:text-blue-400', icon: 'hourglass_top' };
        }
        return { label: 'Submitted', color: 'text-amber-600 dark:text-amber-400', icon: 'send' };
    }

    viewProposal(proposal: any): void {
        const id = proposal?.proposalID ?? proposal?.proposalId;
        if (!id) {
            console.warn('Proposal is missing proposalID; cannot navigate', proposal);
            return;
        }
        this._router.navigate(['/pages/proposal', id]);
    }

    continueDraft(proposal: any): void {
        const org = proposal.organization?._id ?? proposal.organization;
        const orgID = proposal.organization?.organizationID ?? '';
        this._router.navigate(['/pages/proposal/create'], {
            queryParams: {
                org: String(org),
                ...(orgID ? { orgID: String(orgID) } : {}),
                ...(proposal?._id ? { draft: String(proposal._id) } : {}),
            },
        });
    }
}
