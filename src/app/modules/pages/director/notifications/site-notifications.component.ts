import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/auth/auth.service';
import { FeatureAnnouncement } from 'app/core/announcements/feature-announcements';
import { FeatureAnnouncementService } from 'app/core/services/feature-announcement.service';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';

type NoticeUser = { id: string; email: string; name: string; role: string; organizations: string[] };
type ListedNotice = FeatureAnnouncement & { startsOn: string; endsOn: string; audience: string };
type AutomaticNotice = {
    key: string;
    title: string;
    audience: string;
    subject: string;
    summary: string;
    sendsOn: string;
    sentAt: string | null;
    sendsOnDate: Date | null;
};

@Component({
    standalone: false,
    selector: 'app-site-notifications',
    templateUrl: './site-notifications.component.html',
})
export class SiteNotificationsComponent implements OnInit {
    allowed = false;
    loaded = false;
    sending = false;
    users: NoticeUser[] = [];
    userQuery = '';
    selectedUserIds = new Set<string>();
    notices: ListedNotice[] = [];

    title = '';
    body = '';
    sendEmail = false;
    scheduleYear: number | null = null;
    scheduleProjected = false;
    scheduleJobEnabled = false;
    scheduleSaving = false;
    automaticNotices: AutomaticNotice[] = [];
    endsOnDate: Date | null = null;
    minEndDate = new Date();

    constructor(
        private _auth: AuthService,
        private _notices: FeatureAnnouncementService,
        private _dialog: MatDialog,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.minEndDate.setHours(0, 0, 0, 0);
        this.endsOnDate = new Date(this.minEndDate);

        this._auth.checkPresident().subscribe((allowed) => {
            this.allowed = allowed;
            if (!allowed) {
                this.loaded = true;
                this._cdr.markForCheck();
                return;
            }
            this.load();
            this.loadSchedule();
        });
    }

    load(): void {
        this._notices.manage().subscribe({
            next: (res) => {
                this.users = res?.users || [];
                this.selectedUserIds = new Set(this.users.map((user) => user.id));
                this.notices = res?.notices || [];
                this.loaded = true;
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.loaded = true;
                this._snack.open(err?.error?.message || 'Could not load notices', 'OK', { duration: 4000 });
                this._cdr.markForCheck();
            },
        });
    }

    loadSchedule(): void {
        this._notices.schedule().subscribe({
            next: (res) => {
                this.scheduleYear = res?.year ?? null;
                this.scheduleProjected = !!res?.projected;
                this.scheduleJobEnabled = !!res?.jobEnabled;
                this.automaticNotices = (res?.notices || []).map((notice) => ({
                    ...notice,
                    sendsOnDate: this.dateFromDay(notice.sendsOn),
                }));
                this._cdr.markForCheck();
            },
            error: (err) => {
                this._snack.open(err?.error?.message || 'Could not load automatic notices', 'OK', { duration: 4000 });
            },
        });
    }

    saveSchedule(): void {
        const byKey = (key: string) => this.dayFromDate(
            this.automaticNotices.find((notice) => notice.key === key)?.sendsOnDate || null,
        );
        const portalOpenOn = byKey('portal-open');
        const twoWeeksOn = byKey('two-weeks');
        const weekOfOn = byKey('week-of');
        if (!portalOpenOn || !twoWeeksOn || !weekOfOn) {
            this._snack.open('Each notice needs a send date', 'OK', { duration: 3000 });
            return;
        }
        this.scheduleSaving = true;
        this._notices.saveSchedule({ portalOpenOn, twoWeeksOn, weekOfOn }).subscribe({
            next: (res) => {
                this.scheduleSaving = false;
                this.scheduleYear = res?.year ?? this.scheduleYear;
                this.scheduleProjected = !!res?.projected;
                this.scheduleJobEnabled = !!res?.jobEnabled;
                this.automaticNotices = (res?.notices || []).map((notice) => ({
                    ...notice,
                    sendsOnDate: this.dateFromDay(notice.sendsOn),
                }));
                this._snack.open('Send dates saved', 'OK', { duration: 3000 });
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.scheduleSaving = false;
                this._snack.open(err?.error?.message || 'Could not save the send dates', 'OK', { duration: 4000 });
                this._cdr.markForCheck();
            },
        });
    }

    submit(): void {
        if (!this.selectedCount) {
            this._snack.open('Choose at least one user', 'OK', { duration: 3000 });
            return;
        }
        if (this.sendEmail) {
            this._dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Email this notice?',
                    message: `This sends one email to each of the ${this.selectedCount} selected users.`,
                    confirmText: 'Send email',
                    warn: true,
                },
            }).afterClosed().subscribe((ok) => {
                if (ok) {
                    this.send();
                }
            });
            return;
        }
        this.send();
    }

    remove(notice: ListedNotice): void {
        this._notices.remove(notice.id).subscribe({
            next: () => {
                this.notices = this.notices.filter((item) => item.id !== notice.id);
                this._cdr.markForCheck();
            },
            error: (err) => {
                this._snack.open(err?.error?.message || 'Could not remove that notice', 'OK', { duration: 4000 });
            },
        });
    }

    get filteredUsers(): NoticeUser[] {
        const query = this.userQuery.trim().toLowerCase();
        if (!query) {
            return this.users;
        }
        return this.users.filter((user) => {
            const haystack = [user.name, user.email, user.role, ...(user.organizations || [])]
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }

    get selectedCount(): number {
        return this.users.filter((user) => this.selectedUserIds.has(user.id)).length;
    }

    get canSaveSchedule(): boolean {
        return this.automaticNotices.some((notice) => !notice.sentAt);
    }

    get allSelected(): boolean {
        return this.filteredUsers.length > 0
            && this.filteredUsers.every((user) => this.selectedUserIds.has(user.id));
    }

    get someSelected(): boolean {
        const selectedVisible = this.filteredUsers.filter((user) => this.selectedUserIds.has(user.id)).length;
        return selectedVisible > 0 && selectedVisible < this.filteredUsers.length;
    }

    toggleAll(checked: boolean): void {
        const next = new Set(this.selectedUserIds);
        this.filteredUsers.forEach((user) => {
            if (checked) {
                next.add(user.id);
            } else {
                next.delete(user.id);
            }
        });
        this.selectedUserIds = next;
    }

    toggleOne(id: string, checked: boolean): void {
        const next = new Set(this.selectedUserIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        this.selectedUserIds = next;
    }

    private dateFromDay(value: string): Date | null {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
        if (!match) {
            return null;
        }
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    private dayFromDate(date: Date | null): string {
        if (!date) {
            return '';
        }
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    }

    private endDateValue(): string | undefined {
        if (!this.endsOnDate) {
            return undefined;
        }
        const month = String(this.endsOnDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.endsOnDate.getDate()).padStart(2, '0');
        return `${this.endsOnDate.getFullYear()}-${month}-${day}`;
    }

    private send(): void {
        this.sending = true;
        this._notices.send({
            title: this.title.trim(),
            body: this.body.trim(),
            bell: true,
            email: this.sendEmail,
            recipients: [...this.selectedUserIds],
            endsOn: this.endDateValue(),
        }).subscribe({
            next: (res) => {
                this.sending = false;
                this.title = '';
                this.body = '';
                this.userQuery = '';
                const parts = [];
                if (res.bell) {
                    parts.push(`It is on the bell for ${res.bellRecipientCount} users.`);
                }
                if (res.emailQueued) {
                    parts.push(`Email is going out to ${res.emailQueued} users.`);
                }
                this._snack.open(parts.join(' ') || 'Sent', 'OK', { duration: 5000 });
                this.load();
            },
            error: (err) => {
                this.sending = false;
                this._snack.open(err?.error?.message || 'Could not send the notice', 'OK', { duration: 5000 });
                this._cdr.markForCheck();
            },
        });
    }
}
