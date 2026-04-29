import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { AuthService } from 'app/core/auth/auth.service';
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { isUserInOrgUsers } from 'app/core/utilities/organization-access.util';

@Component({
    standalone: false,
    selector: 'proposal',
    templateUrl: './proposal.component.html',
    styleUrls: ['./proposal.component.scss'],
})
export class ProposalComponent implements OnInit, OnDestroy {
    currentUser: any;
    proposalID: string;
    propID: string;
    proposal: any;
    isDirector = false;
    isPresident = false;
    inOrg: boolean;
    viewing: string;
    organizationID: string;
    orgID: string;
    org: any;
    organizationLink: string;
    backLink: string;
    backLabel: string;

    activeTab: 'summary' | 'proposal-info' | 'voting' = 'summary';
    archiveConfirm = false;

    /** True while the header proposal (by public id) is loading — avoids a blank shell before data arrives. */
    proposalLoading = true;

    private readonly _unsubscribeAll = new Subject<void>();

    constructor(
        private _proposalService: ProposalService,
        private _router: Router,
        private route: ActivatedRoute,
        public _authService: AuthService,
        public getOrgService: GetOrganizationService,
        public snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

        this._authService.checkDirector().subscribe((isADirector) => {
            this.isDirector = isADirector;
            if (this.org && this.currentUser?._id) {
                this.checkInOrganization(this.currentUser._id);
            }
            this._cdr.detectChanges();
        });

        this._authService.checkPresident().subscribe((isAPresident) => {
            this.isPresident = isAPresident;
            this._cdr.detectChanges();
        });

        const qpm = this.route.snapshot.queryParamMap;
        if (qpm.get('from') === 'meeting' && qpm.get('meetingId')) {
            this.backLink = '/pages/director/meeting/' + qpm.get('meetingId');
            this.backLabel = 'Back to Meeting';
        }

        this.route.paramMap
            .pipe(
                takeUntil(this._unsubscribeAll),
                map((pm) => pm.get('id')),
                filter((id): id is string => !!id),
                tap((id) => {
                    this.proposalID = id;
                }),
                switchMap((id) => {
                    this.proposalLoading = true;
                    this.proposal = null;
                    this.org = null;
                    this._cdr.detectChanges();
                    return this._proposalService.getProposalByID(id).pipe(
                        finalize(() => {
                            this.proposalLoading = false;
                            this._cdr.detectChanges();
                        }),
                    );
                }),
            )
            .subscribe({
                next: (proposal) => this.applyLoadedProposal(proposal),
                error: (err) => this.onProposalLoadError(err),
            });
    }

    get organizationRouterLink(): string[] | null {
        const oid = this.org?.organizationID;
        return oid ? ['/pages', 'organization', oid] : null;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getProposal(proposalID: string): void {
        this.proposalID = proposalID;
        this.proposalLoading = true;
        this._cdr.detectChanges();
        this._proposalService
            .getProposalByID(proposalID)
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.proposalLoading = false;
                    this._cdr.detectChanges();
                }),
            )
            .subscribe({
                next: (proposal) => this.applyLoadedProposal(proposal),
                error: (err) => this.onProposalLoadError(err),
            });
    }

    refreshProp(): void {
        this.getProposal(this.proposalID);
    }

    private applyLoadedProposal(proposal: any): void {
        if (proposal) {
            this.proposal = proposal;
            this.propID = this.proposal._id;

            this.org = this.proposal.organization;
            this.organizationLink = '/pages/organization/' + this.org.organizationID;

            if (!this.backLabel) {
                this.backLabel = 'Back to Organization';
            }

            this.getOrganization(this.org.organizationID);

            this._cdr.detectChanges();
            Promise.resolve().then(() => this._cdr.detectChanges());
        } else {
            this._router.navigate(['/welcome']);
        }
    }

    private onProposalLoadError(err: unknown): void {
        console.error('getProposalByID failed', err);
        this.snackBar.open(
            'Could not load this proposal. Try again or open it from your organization.',
            'OK',
            { duration: 5000 },
        );
        this._router.navigate(['/welcome']);
    }

    getOrganization(orgID: string): void {
        this.getOrgService.getOrgbyID(orgID).subscribe(
            (org) => {
                this.org = org;
                this.organizationID = this.org._id;

                this.checkInOrganization(this.currentUser._id);
                this.checkIsDirectorAndInOrg();

                this._cdr.detectChanges();
            },
            () => {}
        );
    }

    checkIsDirectorAndInOrg(): void {
        if (this.isDirector && !this.inOrg) {
            this.viewing = 'Viewing: ';
        }
    }

    checkInOrganization(id: string): void {
        this.inOrg = isUserInOrgUsers(this.org?.users, id);

        if (!this.inOrg && !this.isDirector) {
            this._router.navigate(['/welcome']);
            this.snackBar.open('You are not allowed to view this Proposal', undefined, {
                duration: 3000,
            });
        }
    }

    toggleArchive(): void {
        this.archiveConfirm = true;
    }

    confirmArchive(): void {
        const newArchived = !this.proposal.archived;
        this._proposalService.archiveProposal(this.propID, newArchived).subscribe(
            (result) => {
                this.proposal.archived = newArchived;
                this.archiveConfirm = false;
                const msg = newArchived ? 'Proposal archived' : 'Proposal restored';
                this.snackBar.open(msg, 'OK', { duration: 3000 });
            },
            (err) => {
                console.error('archiveProposal error', err);
                this.archiveConfirm = false;
                this.snackBar.open('Error updating proposal', 'OK', { duration: 3000 });
            }
        );
    }

    cancelArchive(): void {
        this.archiveConfirm = false;
    }
}
