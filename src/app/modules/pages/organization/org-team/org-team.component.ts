import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrgTeamService } from 'app/core/services/organization/org-team.service';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-org-team',
    templateUrl: './org-team.component.html',
    styleUrls: ['./org-team.component.scss']
})
export class OrgTeamComponent implements OnInit {
    @Input() org: any;
    @Input() inOrg: boolean;
    @Input() isDirector: boolean;
    @Output() refreshOrg = new EventEmitter<boolean>();

    emailControl = new FormControl('', [Validators.required, Validators.email]);
    adding: boolean = false;
    currentUserId: string;
    pendingInvites: any[] = [];

    constructor(
        private orgTeamService: OrgTeamService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.currentUserId = currentUser?._id;
        this.loadInvites();
    }

    get canManageTeam(): boolean {
        return this.inOrg || this.isDirector;
    }

    loadInvites(): void {
        if (!this.org?._id) { return; }
        this.orgTeamService.getInvites(this.org._id).subscribe({
            next: (invites) => {
                this.pendingInvites = invites;
            },
            error: () => {
                this.pendingInvites = [];
            }
        });
    }

    addUser(): void {
        if (this.emailControl.invalid) { return; }

        this.adding = true;
        const email = this.emailControl.value.trim();

        this.orgTeamService.addUserToOrganization(this.org._id, email).subscribe({
            next: (res) => {
                if (res.invited) {
                    this.snackBar.open('Invite sent! They\'ll be added when they create an account.', 'OK', { duration: 5000 });
                    this.loadInvites();
                } else {
                    this.snackBar.open('User added to organization', 'OK', { duration: 3000 });
                    this.refreshOrg.emit(true);
                }
                this.emailControl.reset();
                this.adding = false;
            },
            error: (err) => {
                const message = err?.error?.message || 'Failed to add user';
                this.snackBar.open(message, 'OK', { duration: 5000 });
                this.adding = false;
            }
        });
    }

    removeUser(user: any): void {
        const isSelf = user._id === this.currentUserId;
        const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email;

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
                    this.snackBar.open('User removed from organization', 'OK', { duration: 3000 });
                    this.refreshOrg.emit(true);
                },
                error: (err) => {
                    const message = err?.error?.message || 'Failed to remove user';
                    this.snackBar.open(message, 'OK', { duration: 5000 });
                }
            });
        });
    }

    cancelInvite(inviteId: string): void {
        this.orgTeamService.cancelInvite(inviteId).subscribe({
            next: () => {
                this.snackBar.open('Invite cancelled', 'OK', { duration: 3000 });
                this.loadInvites();
            },
            error: (err) => {
                const message = err?.error?.message || 'Failed to cancel invite';
                this.snackBar.open(message, 'OK', { duration: 5000 });
            }
        });
    }
}
