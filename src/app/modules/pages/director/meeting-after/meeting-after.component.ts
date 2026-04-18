import { ChangeDetectorRef, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { filter, map } from 'rxjs/operators';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { AuthService } from 'app/core/auth/auth.service';
import { GrantEmailPreviewDialogComponent } from './grant-email-preview-dialog.component';
import { SentGrantEmailViewDialogComponent } from './sent-grant-email-view-dialog.component';

@Component({
    standalone: false,
    selector: 'app-meeting-after',
    templateUrl: './meeting-after.component.html',
    styleUrls: ['./meeting-after.component.scss']
})
export class MeetingAfterComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    /** Incremented on each outbound-email fetch so slower, older HTTP responses cannot overwrite newer data. */
    private emailFetchGeneration = 0;

    @ViewChild(MatPaginator) emailPaginator: MatPaginator;

    meetingId: string;
    meeting: any = null;
    loaded = false;
    emailsLoaded = false;
    emails: any[] = [];
    /** Total grant-notification rows for this meeting (all pages). */
    emailTotal = 0;
    emailPageIndex = 0;
    emailPageSize = 10;
    /** mat-table columns (organization first — same pattern as proposals primary column) */
    displayedEmailColumns = ['organization', 'sent', 'to', 'sentBy', 'view'];
    isPresidentOrAdmin = false;

    constructor(
        private route: ActivatedRoute,
        private meetingService: MeetingService,
        private outboundEmailService: OutboundEmailService,
        private authService: AuthService,
        private dialog: MatDialog,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.authService.checkPresident().subscribe((isP) => {
            this.isPresidentOrAdmin = isP;
            this._changeDetectorRef.markForCheck();
        });

        this.route.paramMap
            .pipe(
                map((p) => p.get('id')),
                filter((id): id is string => !!id),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((id) => {
                this.meetingId = id;
                this.emailFetchGeneration++;
                this.emailPageIndex = 0;
                this.emailTotal = 0;
                this.emails = [];
                this.loadMeeting();
            });
    }

    loadMeeting(): void {
        this.loaded = false;
        this.meetingService.getMeeting(this.meetingId).subscribe({
            next: (m) => {
                this.meeting = m;
                this.loaded = true;
                this.loadEmails();
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.meeting = null;
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    loadEmails(): void {
        if (!this.meetingId) {
            return;
        }
        const generation = ++this.emailFetchGeneration;
        this.emailsLoaded = false;
        const page = this.emailPageIndex + 1;
        this.outboundEmailService.getMeetingGrantEmails(this.meetingId, page, this.emailPageSize).subscribe({
            next: (res: { items?: unknown[]; total?: unknown } | unknown[]) => {
                if (generation !== this.emailFetchGeneration) {
                    return;
                }
                const raw = res as { items?: unknown[]; total?: unknown };
                const items = Array.isArray(raw?.items)
                    ? raw.items
                    : Array.isArray(res)
                      ? res
                      : [];
                this.emails = items as any[];
                const t = raw?.total;
                this.emailTotal =
                    typeof t === 'number' && Number.isFinite(t)
                        ? t
                        : typeof t === 'string' && String(t).trim() !== '' && Number.isFinite(Number(t))
                          ? Number(t)
                          : Array.isArray(res) && !('items' in (res as object))
                            ? (res as unknown[]).length
                            : this.emails.length;
                this.emailsLoaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                if (generation !== this.emailFetchGeneration) {
                    return;
                }
                this.emails = [];
                this.emailTotal = 0;
                this.emailsLoaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    handleEmailPage(e: PageEvent): void {
        this.emailPageIndex = e.pageIndex;
        this.emailPageSize = e.pageSize;
        this.loadEmails();
    }

    openSentEmailViewer(row: { _id?: string }): void {
        const id = row?._id;
        if (!this.meetingId || !id) {
            return;
        }
        this.dialog.open(SentGrantEmailViewDialogComponent, {
            width: '720px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            autoFocus: 'dialog',
            data: {
                meetingId: this.meetingId,
                emailId: id
            }
        });
    }

    openGrantEmailPreview(): void {
        if (this.meeting?.status !== 'completed' || !this.meetingId) {
            return;
        }
        this.dialog
            .open(GrantEmailPreviewDialogComponent, {
                width: 'min(1000px, 98vw)',
                maxWidth: '98vw',
                maxHeight: '94vh',
                autoFocus: 'dialog',
                data: {
                    meetingId: this.meetingId,
                    canSend: this.isPresidentOrAdmin
                }
            })
            .afterClosed()
            .subscribe((didSend: boolean) => {
                if (didSend) {
                    this.emailPageIndex = 0;
                    if (this.emailPaginator) {
                        this.emailPaginator.firstPage();
                    }
                    this.loadEmails();
                }
            });
    }

    senderLabel(e: any): string {
        const u = e?.sentBy;
        if (!u) return '—';
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return name || u.email || '—';
    }
}
