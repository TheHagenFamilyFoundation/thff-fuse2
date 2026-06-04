import {
    ChangeDetectorRef,
    Component,
    OnInit,
    OnChanges,
    AfterViewInit,
    SimpleChanges,
    Input,
    Output,
    EventEmitter,
    ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { OrgTeamService } from 'app/core/services/organization/org-team.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';

export type TeamTableRow = {
    kind: 'member' | 'invite';
    memberLabel: string;
    email: string;
    status: 'Active' | 'Pending';
    /** When the member joined the org, or when the invite was created */
    addedAt?: string | Date | null;
    user?: any;
    invite?: any;
};

@Component({
    standalone: false,
    selector: 'app-org-team',
    templateUrl: './org-team.component.html',
    styleUrls: ['./org-team.component.scss']
})
export class OrgTeamComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() org: any;
    @Input() inOrg: boolean;
    @Input() isDirector: boolean;
    @Output() refreshOrg = new EventEmitter<boolean>();

    private paginator: MatPaginator;

    @ViewChild(MatPaginator)
    set paginatorRef(p: MatPaginator | undefined) {
        this.paginator = p;
        this.teamDataSource.paginator = p ?? null;
    }

    emailControl = new FormControl('', [Validators.required, Validators.email]);
    adding: boolean = false;
    resendingInviteId: string | null = null;
    currentUserId: string;
    pendingInvites: any[] = [];

    readonly displayedColumns: string[] = [
        'member',
        'email',
        'addedAt',
        'status',
        'actions',
    ];

    readonly teamDataSource = new MatTableDataSource<TeamTableRow>([]);

    readonly pageSizeOptions = [5, 10, 25];
    tablePageSize: number;

    constructor(
        private orgTeamService: OrgTeamService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _userPreferences: UserPreferencesService,
    ) {
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.pageSizeOptions);
    }

    ngOnInit(): void {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.currentUserId = currentUser?._id;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['org']) {
            return;
        }
        this.syncTeamTable();
        if (this.org?._id) {
            this.loadInvites();
        }
    }

    ngAfterViewInit(): void {
        this.syncTeamTable();
    }

    get canManageTeam(): boolean {
        return this.inOrg || this.isDirector;
    }

    get teamRowCount(): number {
        return this.teamDataSource.data.length;
    }

    onTeamPage(event: { pageSize: number }): void {
        if (event.pageSize !== this.tablePageSize) {
            this._userPreferences.setTablePageSize(event.pageSize);
            this.tablePageSize = event.pageSize;
        }
    }

    /**
     * GET /organization usually returns flattened users; if the payload still has
     * membership shape `{ user, joinedAt }`, merge so the table can show name/email.
     */
    private resolveMemberUser(u: any): any {
        if (!u || typeof u !== 'object') {
            return u;
        }
        if (u.email != null || u.firstName != null || u.lastName != null) {
            return u;
        }
        if (u.user != null && typeof u.user === 'object') {
            return {
                ...u.user,
                joinedOrganizationAt:
                    u.joinedOrganizationAt ?? u.joinedAt,
            };
        }
        return u;
    }

    private buildTeamRows(): TeamTableRow[] {
        const users = this.org?.users || [];
        const members: TeamTableRow[] = users.map((u: any) => {
            const m = this.resolveMemberUser(u);
            const staleRef =
                !m?.email &&
                typeof m?.missingAccountUserId === 'string' &&
                m.missingAccountUserId.length > 0;
            const memberLabel =
                m.firstName && m.lastName
                    ? `${m.firstName} ${m.lastName}`
                    : staleRef
                      ? 'Former member'
                      : m.email || '—';
            const email = staleRef ? 'No account on file' : m.email || '—';
            // Remove API uses :userId — dangling rows only have missingAccountUserId
            const userForActions = staleRef
                ? { ...m, _id: m.missingAccountUserId }
                : m;
            return {
                kind: 'member',
                memberLabel,
                email,
                status: 'Active',
                addedAt: m.joinedOrganizationAt ?? null,
                user: userForActions,
            };
        });

        const invites: TeamTableRow[] = (this.pendingInvites || []).map((inv: any) => ({
            kind: 'invite',
            memberLabel: '—',
            email: inv.email || '—',
            status: 'Pending',
            addedAt: inv.createdAt ?? null,
            invite: inv,
        }));

        return [...members, ...invites];
    }

    private syncTeamTable(): void {
        const rows = this.buildTeamRows();
        this.teamDataSource.data = rows;
        if (this.paginator && rows.length > 0) {
            const lastPage = Math.max(
                0,
                Math.ceil(rows.length / this.paginator.pageSize) - 1
            );
            if (this.paginator.pageIndex > lastPage) {
                this.paginator.lastPage();
            }
        }
    }

    /**
     * @param done optional callback after invites are applied (e.g. show snackbar after table updates)
     */
    loadInvites(done?: () => void): void {
        if (!this.org?._id) {
            done?.();
            return;
        }
        this.orgTeamService.getInvites(this.org._id).subscribe({
            next: (invites) => {
                this.pendingInvites = Array.isArray(invites) ? invites : [];
                this.syncTeamTable();
                this.cdr.detectChanges();
                done?.();
            },
            error: () => {
                this.pendingInvites = [];
                this.syncTeamTable();
                this.cdr.detectChanges();
                done?.();
            },
        });
    }

    addUser(): void {
        if (this.emailControl.invalid) {
            return;
        }

        this.adding = true;
        const email = this.emailControl.value.trim();

        this.orgTeamService.addUserToOrganization(this.org._id, email).subscribe({
            next: (res) => {
                if (res?.invited) {
                    if (res.invite) {
                        const list = this.pendingInvites || [];
                        const exists = list.some(
                            (i: { _id?: string }) =>
                                i?._id && res.invite?._id &&
                                String(i._id) === String(res.invite._id)
                        );
                        this.pendingInvites = exists
                            ? list
                            : [...list, res.invite];
                        this.syncTeamTable();
                        this.cdr.detectChanges();
                    }
                    this.loadInvites(() => {
                        this.snackBar.open(
                            'Invite sent! They\'ll be added when they create an account.',
                            undefined,
                            { duration: 5000 }
                        );
                    });
                } else {
                    this.snackBar.open('User added to organization', undefined, {
                        duration: 3000,
                    });
                    this.refreshOrg.emit(true);
                }
                this.emailControl.reset();
                this.adding = false;
            },
            error: (err) => {
                const message = err?.error?.message || 'Failed to add user';
                this.snackBar.open(message, undefined, { duration: 5000 });
                this.adding = false;
            },
        });
    }

    removeUser(user: any): void {
        const isSelf = user._id === this.currentUserId;
        const displayName =
            user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email && user.email !== '—'
                  ? user.email
                  : 'this former member';

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Remove Member',
                message: isSelf
                    ? 'Are you sure you want to remove yourself from this organization? You will lose access.'
                    : `Are you sure you want to remove ${displayName} from this organization?`,
                confirmText: 'Remove',
                cancelText: 'Cancel',
                warn: true
            }
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
            if (!confirmed) { return; }

            this.orgTeamService.removeUserFromOrganization(this.org._id, user._id).subscribe({
                next: () => {
                    this.snackBar.open('User removed from organization', undefined, {
                        duration: 3000,
                    });
                    this.refreshOrg.emit(true);
                },
                error: (err) => {
                    const message = err?.error?.message || 'Failed to remove user';
                    this.snackBar.open(message, undefined, { duration: 5000 });
                }
            });
        });
    }

    resendInvite(inviteId: string): void {
        this.resendingInviteId = inviteId;
        this.orgTeamService.resendInvite(inviteId).subscribe({
            next: () => {
                this.snackBar.open('Invite resent', undefined, { duration: 3000 });
                this.resendingInviteId = null;
            },
            error: (err) => {
                const message = err?.error?.message || 'Failed to resend invite';
                this.snackBar.open(message, undefined, { duration: 5000 });
                this.resendingInviteId = null;
            }
        });
    }

    cancelInvite(inviteId: string): void {
        this.orgTeamService.cancelInvite(inviteId).subscribe({
            next: () => {
                this.snackBar.open('Invite cancelled', undefined, { duration: 3000 });
                this.loadInvites();
            },
            error: (err) => {
                const message = err?.error?.message || 'Failed to cancel invite';
                this.snackBar.open(message, undefined, { duration: 5000 });
            }
        });
    }
}
