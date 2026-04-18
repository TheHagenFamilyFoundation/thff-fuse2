import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';

/** Must match server `defaultGrantMessagePlain()` when API omits `messagePlain`. */
const DEFAULT_GRANT_MESSAGE_PLAIN =
    'We are grateful for the work your organization does in the community. ' +
    'This award reflects our confidence in your program and our mission to serve as a catalyst for change.';

export interface GrantEmailPreviewDialogData {
    meetingId: string;
    canSend: boolean;
}

export interface GrantEmailPreviewRow {
    organizationName: string;
    email: string | null;
    proposalTitle: string;
    willSend: boolean;
    skipReason: string | null;
}

export interface GrantEmailPreviewItem {
    /** Mongo id for send overrides (required for edited sends). */
    organizationId: string | null;
    organizationName: string;
    subject: string;
    /** Editable plain-text paragraph (middle of the letter). */
    messagePlain: string;
    /** Full HTML from API — updated after load and when leaving edit mode. */
    renderedHtml: string;
}

@Component({
    standalone: false,
    selector: 'app-grant-email-preview-dialog',
    templateUrl: './grant-email-preview-dialog.component.html',
    styleUrls: ['./grant-email-preview-dialog.component.scss']
})
export class GrantEmailPreviewDialogComponent implements OnInit {
    loading = true;
    error: string | null = null;
    meetingYear: number;
    rows: GrantEmailPreviewRow[] = [];
    counts: { ready: number; skipped: number } = { ready: 0, skipped: 0 };
    sending = false;
    /** One entry per organization that will receive mail (rendered HTML from API). */
    emailPreviews: GrantEmailPreviewItem[] = [];
    /** Which panels are in plain-text edit mode (organizationId keys). */
    private readonly editingOrgIds = new Set<string>();
    /** While re-rendering HTML for one org after text edits. */
    previewRefreshingOrgId: string | null = null;

    constructor(
        public dialogRef: MatDialogRef<GrantEmailPreviewDialogComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) public data: GrantEmailPreviewDialogData,
        private meetingService: MeetingService,
        private outboundEmailService: OutboundEmailService,
        private snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef,
        private _sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.meetingService.previewGrantEmails(this.data.meetingId).subscribe({
            next: (res) => {
                this.rows = Array.isArray(res?.rows) ? res.rows : [];
                this.counts =
                    res?.counts && typeof res.counts.ready === 'number'
                        ? res.counts
                        : { ready: 0, skipped: 0 };
                this.meetingYear = res?.meeting?.year;
                const rawList = Array.isArray(res?.emailPreviews) ? res.emailPreviews : [];
                this.emailPreviews = rawList.map(
                    (p: {
                        organizationId?: string | null;
                        organizationName?: string;
                        subject?: string;
                        messagePlain?: string;
                        html?: string;
                    }) => {
                        const html = typeof p?.html === 'string' && p.html.trim() ? p.html : '';
                        return {
                            organizationId:
                                typeof p?.organizationId === 'string' &&
                                /^[a-fA-F0-9]{24}$/.test(p.organizationId)
                                    ? p.organizationId
                                    : null,
                            organizationName: typeof p?.organizationName === 'string' ? p.organizationName : '',
                            subject: typeof p?.subject === 'string' ? p.subject : '',
                            messagePlain:
                                typeof p?.messagePlain === 'string' ? p.messagePlain : DEFAULT_GRANT_MESSAGE_PLAIN,
                            renderedHtml: html
                        };
                    }
                );
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.error =
                    (typeof err?.error?.message === 'string' && err.error.message) ||
                    (err?.status === 0 ? 'Network error — check your connection.' : null) ||
                    'Could not load preview';
                this.loading = false;
                this._cdr.markForCheck();
            }
        });
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

    /** Recipient address for an outgoing preview (matched by organization name). */
    recipientEmail(organizationName: string): string | null {
        const r = this.rows.find((x) => x.organizationName === organizationName && x.willSend);
        return r?.email ?? null;
    }

    get skippedRows(): GrantEmailPreviewRow[] {
        return this.rows.filter((r) => !r.willSend);
    }

    trackByOrgId(_index: number, item: GrantEmailPreviewItem): string {
        return item.organizationId || item.organizationName || String(_index);
    }

    trustedHtml(preview: GrantEmailPreviewItem): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(preview.renderedHtml || '');
    }

    isEditing(preview: GrantEmailPreviewItem): boolean {
        return !!(preview.organizationId && this.editingOrgIds.has(preview.organizationId));
    }

    isRefreshingPreview(preview: GrantEmailPreviewItem): boolean {
        return !!(preview.organizationId && this.previewRefreshingOrgId === preview.organizationId);
    }

    toggleEdit(preview: GrantEmailPreviewItem): void {
        const id = preview.organizationId;
        if (!id) {
            return;
        }
        if (this.editingOrgIds.has(id)) {
            this.editingOrgIds.delete(id);
            this.refreshRenderedHtml(preview);
        } else {
            this.editingOrgIds.add(id);
        }
        this._cdr.markForCheck();
    }

    private refreshRenderedHtml(preview: GrantEmailPreviewItem): void {
        if (!preview.organizationId || !this.data.meetingId) {
            return;
        }
        this.previewRefreshingOrgId = preview.organizationId;
        this.meetingService
            .renderGrantEmailPreview(this.data.meetingId, {
                organizationId: preview.organizationId,
                messagePlain: preview.messagePlain ?? ''
            })
            .subscribe({
                next: (res) => {
                    this.previewRefreshingOrgId = null;
                    if (typeof res?.html === 'string') {
                        preview.renderedHtml = res.html;
                    }
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.previewRefreshingOrgId = null;
                    this.snackBar.open('Could not refresh preview', 'OK', { duration: 4000 });
                    this._cdr.markForCheck();
                }
            });
    }

    confirmSend(): void {
        if (!this.data.canSend || this.sending || this.counts.ready === 0) {
            return;
        }
        this.sending = true;
        const customizations = this.emailPreviews
            .filter((p) => p.organizationId)
            .map((p) => ({
                organizationId: p.organizationId as string,
                subject: String(p.subject || '').trim(),
                messagePlain: p.messagePlain ?? ''
            }));
        this.outboundEmailService
            .sendGrantNotifications(this.data.meetingId, { customizations })
            .subscribe({
                next: (res) => {
                    this.sending = false;
                    const n = res?.counts?.sent ?? 0;
                    const sk = res?.counts?.skipped ?? 0;
                    this.snackBar.open(
                        `Sent ${n} grant notification(s). ${sk} skipped (no email or error).`,
                        'OK',
                        { duration: 6000 }
                    );
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.sending = false;
                    const msg = err?.error?.message || 'Failed to send';
                    this.snackBar.open(msg, 'OK', { duration: 5000 });
                }
            });
    }
}
