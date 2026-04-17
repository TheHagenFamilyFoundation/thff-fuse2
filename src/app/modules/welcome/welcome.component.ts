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

    drafts: { orgId: string; orgName: string; title: string; }[] = [];

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
        this.loadDrafts();
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

    loadDrafts(): void {
        this.drafts = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('proposal-draft-')) {
                try {
                    const draft = JSON.parse(localStorage.getItem(key));
                    if (draft && draft.projectTitle) {
                        const orgId = key.replace('proposal-draft-', '');
                        this.drafts.push({
                            orgId,
                            orgName: '',
                            title: draft.projectTitle
                        });
                    }
                } catch (e) {
                    // skip invalid drafts
                }
            }
        }
    }

    getProposalStatus(proposal: any): { label: string; color: string; icon: string } {
        if (proposal.sponsor) {
            return { label: 'Sponsored', color: 'text-green-600 dark:text-green-400', icon: 'check_circle' };
        }
        if (proposal.votes?.length > 0) {
            return { label: 'Under Review', color: 'text-blue-600 dark:text-blue-400', icon: 'hourglass_top' };
        }
        return { label: 'Submitted', color: 'text-amber-600 dark:text-amber-400', icon: 'send' };
    }

    viewProposal(proposal: any): void {
        this._router.navigate(['/pages/proposal', proposal.proposalID]);
    }

    continueDraft(draft: any): void {
        this._router.navigate(['/pages/organization', draft.orgId]);
    }
}
