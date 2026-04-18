import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';

export interface SentGrantEmailViewDialogData {
    meetingId: string;
    emailId: string;
}

@Component({
    standalone: false,
    selector: 'app-sent-grant-email-view-dialog',
    templateUrl: './sent-grant-email-view-dialog.component.html',
    styleUrls: ['./sent-grant-email-view-dialog.component.scss']
})
export class SentGrantEmailViewDialogComponent implements OnInit {
    loading = true;
    error: string | null = null;
    subject = '';
    to = '';
    sentAt: string | null = null;
    bodyHtml: SafeHtml | null = null;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SentGrantEmailViewDialogData,
        private outboundEmailService: OutboundEmailService,
        private sanitizer: DomSanitizer,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.outboundEmailService.getMeetingGrantEmailById(this.data.meetingId, this.data.emailId).subscribe({
            next: (doc) => {
                this.subject = typeof doc?.subject === 'string' ? doc.subject : '';
                this.to = typeof doc?.to === 'string' ? doc.to : '';
                const raw = doc?.htmlBody;
                if (typeof raw === 'string' && raw.trim()) {
                    this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(raw);
                } else {
                    this.bodyHtml = null;
                }
                const ca = doc?.createdAt;
                this.sentAt = ca ? String(ca) : null;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.error =
                    (typeof err?.error?.message === 'string' && err.error.message) ||
                    (err?.status === 0 ? 'Network error — check your connection.' : null) ||
                    'Could not load this email';
                this.loading = false;
                this._cdr.markForCheck();
            }
        });
    }
}
