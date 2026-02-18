import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';

@Component({
    selector     : 'welcome',
    templateUrl  : './welcome.component.html',
    encapsulation: ViewEncapsulation.None
})
export class WelcomeComponent implements OnInit
{
    latestSubmissionYear: any;
    portalOpen: boolean = false;
    loading: boolean = true;

    proposals: any[] = [];
    proposalsLoading: boolean = false;

    drafts: { orgId: string; orgName: string; title: string; }[] = [];

    constructor(
        private _submissionYearsService: SubmissionYearsService,
        private _proposalService: ProposalService,
        private _router: Router
    ) {}

    ngOnInit(): void {
        this.getLatestSubmissionYear();
        this.loadDrafts();
    }

    getLatestSubmissionYear(): void {
        this.loading = true;
        this._submissionYearsService.getLatestSubmissionYear()
            .subscribe({
                next: (year) => {
                    this.latestSubmissionYear = year;
                    if (year) {
                        this.portalOpen = year.active;
                        this.loadMyProposals(year.year);
                    }
                    this.loading = false;
                },
                error: (err) => {
                    console.error('getLatestSubmissionYear - err', err);
                    this.loading = false;
                    this.latestSubmissionYear = null;
                    this.portalOpen = false;
                }
            });
    }

    loadMyProposals(year: number): void {
        this.proposalsLoading = true;
        this._proposalService.getMyProposals(year)
            .subscribe({
                next: (proposals) => {
                    this.proposals = proposals || [];
                    this.proposalsLoading = false;
                },
                error: (err) => {
                    console.error('loadMyProposals - err', err);
                    this.proposals = [];
                    this.proposalsLoading = false;
                }
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
