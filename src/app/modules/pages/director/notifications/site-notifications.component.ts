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
    allEmails = false;
    allEmailTotal: number | null = null;
    userQuery = '';
    searching = false;
    searchResults: NoticeUser[] = [];
    addedUsers: NoticeUser[] = [];
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

    private _searchTimer: ReturnType<typeof setTimeout> | null = null;

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
        if (!this.allEmails && !this.addedUsers.length) {
            this._snack.open('Add someone, or check All emails', 'OK', { duration: 3000 });
            return;
        }
        if (this.allEmails) {
            this.confirmAllEmails();
            return;
        }
        if (this.sendEmail) {
            this._dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Email this notice?',
                    message: `This sends one email to each of the ${this.addedUsers.length} selected users.`,
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

    toggleAllEmails(checked: boolean): void {
        this.allEmails = checked;
        if (!checked) {
            this._cdr.markForCheck();
            return;
        }
        this.allEmailTotal = null;
        this._notices.recipientCount().subscribe({
            next: (res) => {
                this.allEmailTotal = Number(res?.total || 0);
                this._cdr.markForCheck();
            },
            error: () => {
                this.allEmails = false;
                this._snack.open('Could not count emails', 'OK', { duration: 4000 });
                this._cdr.markForCheck();
            },
        });
    }

    onUserQuery(value: string): void {
        this.userQuery = value;
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
        }
        const query = value.trim();
        if (query.length < 2) {
            this.searching = false;
            this.searchResults = [];
            this._cdr.markForCheck();
            return;
        }
        this.searching = true;
        this._searchTimer = setTimeout(() => this.search(query), 250);
    }

    addUser(user: NoticeUser): void {
        if (this.isAdded(user.id)) {
            return;
        }
        this.addedUsers = [...this.addedUsers, user];
    }

    removeUser(id: string): void {
        this.addedUsers = this.addedUsers.filter((user) => user.id !== id);
    }

    isAdded(id: string): boolean {
        return this.addedUsers.some((user) => user.id === id);
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

    get canSaveSchedule(): boolean {
        return this.automaticNotices.some((notice) => !notice.sentAt);
    }

    private search(query: string): void {
        this._notices.searchRecipients(query).subscribe({
            next: (res) => {
                if (this.userQuery.trim() !== query) {
                    return;
                }
                this.searching = false;
                this.searchResults = res?.users || [];
                this._cdr.markForCheck();
            },
            error: () => {
                if (this.userQuery.trim() !== query) {
                    return;
                }
                this.searching = false;
                this.searchResults = [];
                this._snack.open('Could not search users', 'OK', { duration: 4000 });
                this._cdr.markForCheck();
            },
        });
    }

    private confirmAllEmails(): void {
        const open = (total: number) => {
            const emailLine = this.sendEmail
                ? `This sends one email to each of the ${total} people.`
                : `This goes on the bell for ${total} people.`;
            this._dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Send to all emails?',
                    message: emailLine,
                    confirmText: 'Send',
                    warn: true,
                },
            }).afterClosed().subscribe((ok) => {
                if (ok) {
                    this.send();
                }
            });
        };
        if (this.allEmailTotal !== null) {
            open(this.allEmailTotal);
            return;
        }
        this._notices.recipientCount().subscribe({
            next: (res) => {
                this.allEmailTotal = Number(res?.total || 0);
                this._cdr.markForCheck();
                open(this.allEmailTotal);
            },
            error: () => {
                this._snack.open('Could not count emails', 'OK', { duration: 4000 });
            },
        });
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
            allEmails: this.allEmails,
            recipients: this.allEmails ? [] : this.addedUsers.map((user) => user.id),
            endsOn: this.endDateValue(),
        }).subscribe({
            next: (res) => {
                this.sending = false;
                this.title = '';
                this.body = '';
                this.userQuery = '';
                this.searchResults = [];
                this.addedUsers = [];
                this.allEmails = false;
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
