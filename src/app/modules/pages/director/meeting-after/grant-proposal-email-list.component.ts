import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfirmDialogComponent } from 'app/common/components/confirm-dialog/confirm-dialog.component';
import { MeetingService } from 'app/core/services/admin/meeting.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { SentGrantEmailViewDialogComponent } from './sent-grant-email-view-dialog.component';

export interface GrantProposalEmailRow {
    allocationId: string;
    proposalId: string | null;
    proposalTitle: string;
    organizationId: string | null;
    organizationName: string;
    amountGranted: number;
    email: string | null;
    canSend: boolean;
    skipReason: string | null;
    sendCount: number;
    lastSentAt: string | null;
    lastSentEmailId: string | null;
    lastSentTo: string | null;
    subject: string;
    messagePlain: string;
    html: string;
}

@Component({
    standalone: false,
    selector: 'app-grant-proposal-email-list',
    templateUrl: './grant-proposal-email-list.component.html',
    styleUrls: ['./grant-proposal-email-list.component.scss'],
})
export class GrantProposalEmailListComponent implements OnInit, OnChanges {
    @Input() meetingId: string;
    @Input() canSend = false;
    @Output() sent = new EventEmitter<void>();

    loading = true;
    error: string | null = null;
    meetingYear: number;
    proposals: GrantProposalEmailRow[] = [];
    counts: { ready: number; skipped: number } = { ready: 0, skipped: 0 };
    sendingAllocationId: string | null = null;
    sendingBulk = false;
    previewRefreshingAllocationId: string | null = null;
    readonly expandedAllocationIds = new Set<string>();
    private readonly editingAllocationIds = new Set<string>();

    constructor(
        private meetingService: MeetingService,
        private outboundEmailService: OutboundEmailService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _cdr: ChangeDetectorRef,
        private _sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadProposals();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['meetingId'] && !changes['meetingId'].firstChange) {
            this.loadProposals();
        }
    }

    loadProposals(): void {
        if (!this.meetingId) {
            return;
        }
        this.loading = true;
        this.error = null;
        this.proposals = [];
        this.counts = { ready: 0, skipped: 0 };
        this.expandedAllocationIds.clear();
        this.editingAllocationIds.clear();
        this.sendingAllocationId = null;
        this.sendingBulk = false;

        this.outboundEmailService.getGrantEmailProposals(this.meetingId).subscribe({
            next: (res) => {
                this.proposals = Array.isArray(res?.proposals) ? res.proposals : [];
                this.counts =
                    res?.counts && typeof res.counts.ready === 'number'
                        ? res.counts
                        : { ready: 0, skipped: 0 };
                this.meetingYear = res?.meeting?.year;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.error =
                    (typeof err?.error?.message === 'string' && err.error.message) ||
                    (err?.status === 0 ? 'Network error — check your connection.' : null) ||
                    'Could not load proposals';
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    get hasAnySent(): boolean {
        return this.proposals.some((p) => p.sendCount > 0);
    }

    /** Before any notifications go out — offer one bundled send for all ready proposals. */
    get isFirstRound(): boolean {
        return !this.hasAnySent;
    }

    get unsentReadyProposals(): GrantProposalEmailRow[] {
        return this.proposals.filter((p) => p.canSend && p.sendCount === 0);
    }

    /** Status line under the page intro; hidden when the first-round banner already covers it. */
    get emailStatusSummary(): string | null {
        if (this.isFirstRound && this.unsentReadyProposals.length <= 1) {
            return null;
        }
        const ready = this.counts?.ready ?? 0;
        const skipped = this.counts?.skipped ?? 0;
        const parts: string[] = [];
        if (ready > 0) {
            parts.push(
                ready === 1 ? '1 funded proposal to notify' : `${ready} funded proposals to notify`
            );
        }
        if (skipped > 0) {
            parts.push(skipped === 1 ? '1 missing email' : `${skipped} missing emails`);
        }
        if (!parts.length) {
            return null;
        }
        return parts.join(' · ');
    }

    get isSendingAny(): boolean {
        return this.sendingBulk || !!this.sendingAllocationId;
    }

    trackProposal(_index: number, row: GrantProposalEmailRow): string {
        return row.allocationId || String(_index);
    }

    isPanelExpanded(row: GrantProposalEmailRow): boolean {
        return this.expandedAllocationIds.has(row.allocationId);
    }

    onPanelOpened(row: GrantProposalEmailRow): void {
        this.expandedAllocationIds.add(row.allocationId);
    }

    onPanelClosed(row: GrantProposalEmailRow): void {
        this.expandedAllocationIds.delete(row.allocationId);
    }

    expandAll(): void {
        for (const row of this.proposals) {
            this.expandedAllocationIds.add(row.allocationId);
        }
        this._cdr.markForCheck();
    }

    collapseAll(): void {
        this.expandedAllocationIds.clear();
        this._cdr.markForCheck();
    }

    trustedHtml(row: GrantProposalEmailRow): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(row.html || '');
    }

    isEditing(row: GrantProposalEmailRow): boolean {
        return this.editingAllocationIds.has(row.allocationId);
    }

    isRefreshingPreview(row: GrantProposalEmailRow): boolean {
        return this.previewRefreshingAllocationId === row.allocationId;
    }

    isSending(row: GrantProposalEmailRow): boolean {
        return this.sendingAllocationId === row.allocationId;
    }

    toggleEdit(row: GrantProposalEmailRow, event?: Event): void {
        event?.stopPropagation();
        if (this.editingAllocationIds.has(row.allocationId)) {
            this.editingAllocationIds.delete(row.allocationId);
            this.refreshRenderedHtml(row);
        } else {
            this.editingAllocationIds.add(row.allocationId);
            this.expandedAllocationIds.add(row.allocationId);
        }
        this._cdr.markForCheck();
    }

    private refreshRenderedHtml(row: GrantProposalEmailRow): void {
        this.previewRefreshingAllocationId = row.allocationId;
        this.meetingService
            .renderGrantEmailPreview(this.meetingId, {
                allocationId: row.allocationId,
                messagePlain: row.messagePlain ?? '',
            })
            .subscribe({
                next: (res) => {
                    this.previewRefreshingAllocationId = null;
                    if (typeof res?.html === 'string') {
                        row.html = res.html;
                    }
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.previewRefreshingAllocationId = null;
                    this.snackBar.open('Could not refresh preview', 'OK', { duration: 4000 });
                    this._cdr.markForCheck();
                },
            });
    }

    sendProposal(row: GrantProposalEmailRow, event?: Event): void {
        event?.stopPropagation();
        if (!this.canSend || !row.canSend || this.isSendingAny) {
            return;
        }

        const label = this.proposalLabel(row);
        const recipient = row.email ? ` to ${row.email}` : '';
        const isResend = row.sendCount > 0;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: isResend ? 'Send grant notification again?' : 'Send grant notification?',
                message: isResend
                    ? `Send another grant notification for “${label}”${recipient}?`
                    : `Send the grant notification for “${label}”${recipient}?`,
                confirmText: isResend ? 'Send again' : 'Send',
                cancelText: 'Cancel',
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeSendProposal(row);
            }
        });
    }

    private executeSendProposal(row: GrantProposalEmailRow): void {
        if (!this.canSend || !row.canSend || this.isSendingAny) {
            return;
        }
        this.sendingAllocationId = row.allocationId;
        this.outboundEmailService
            .sendGrantNotifications(this.meetingId, {
                allocationIds: [row.allocationId],
                customizations: [
                    {
                        allocationId: row.allocationId,
                        organizationId: row.organizationId || undefined,
                        subject: String(row.subject || '').trim(),
                        messagePlain: row.messagePlain ?? '',
                    },
                ],
            })
            .subscribe({
                next: (res) => {
                    this.sendingAllocationId = null;
                    const n = res?.counts?.sent ?? 0;
                    this.snackBar.open(
                        n === 1
                            ? `Grant notification sent for “${this.proposalLabel(row)}”.`
                            : `Sent ${n} grant notification(s).`,
                        'OK',
                        { duration: 5000 }
                    );
                    this.sent.emit();
                    this.loadProposals();
                },
                error: (err) => {
                    this.sendingAllocationId = null;
                    const msg = err?.error?.message || 'Failed to send';
                    this.snackBar.open(msg, 'OK', { duration: 5000 });
                    this._cdr.markForCheck();
                },
            });
    }

    sendAllFirstRound(): void {
        const rows = this.unsentReadyProposals;
        if (!this.canSend || !this.isFirstRound || rows.length === 0 || this.isSendingAny) {
            return;
        }

        const n = rows.length;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '440px',
            data: {
                title: n === 1 ? 'Send grant notification?' : 'Send all grant notifications?',
                message: this.buildBulkSendConfirmMessage(rows),
                confirmText: n === 1 ? 'Send 1 email' : `Send all ${n} emails`,
                cancelText: 'Cancel',
            },
        });
        ref.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.executeSendAllFirstRound(rows);
            }
        });
    }

    private executeSendAllFirstRound(rows: GrantProposalEmailRow[]): void {
        if (!this.canSend || !this.isFirstRound || rows.length === 0 || this.isSendingAny) {
            return;
        }
        this.sendingBulk = true;
        this.outboundEmailService
            .sendGrantNotifications(this.meetingId, {
                allocationIds: rows.map((r) => r.allocationId),
                customizations: rows.map((r) => ({
                    allocationId: r.allocationId,
                    organizationId: r.organizationId || undefined,
                    subject: String(r.subject || '').trim(),
                    messagePlain: r.messagePlain ?? '',
                })),
            })
            .subscribe({
                next: (res) => {
                    this.sendingBulk = false;
                    const sent = res?.counts?.sent ?? 0;
                    const sk = res?.counts?.skipped ?? 0;
                    this.snackBar.open(
                        sent === 1
                            ? `Sent 1 grant notification.${sk ? ` ${sk} skipped.` : ''}`
                            : `Sent ${sent} grant notifications.${sk ? ` ${sk} skipped.` : ''}`,
                        'OK',
                        { duration: 6000 }
                    );
                    this.sent.emit();
                    this.loadProposals();
                },
                error: (err) => {
                    this.sendingBulk = false;
                    const msg = err?.error?.message || 'Failed to send';
                    this.snackBar.open(msg, 'OK', { duration: 5000 });
                    this._cdr.markForCheck();
                },
            });
    }

    private proposalLabel(row: GrantProposalEmailRow): string {
        const title = row.proposalTitle?.trim();
        if (title) {
            return title;
        }
        const org = row.organizationName?.trim();
        if (org) {
            return org;
        }
        return 'this proposal';
    }

    private buildBulkSendConfirmMessage(rows: GrantProposalEmailRow[]): string {
        if (rows.length === 1) {
            const row = rows[0];
            const recipient = row.email ? ` to ${row.email}` : '';
            return `Send the grant notification for “${this.proposalLabel(row)}”${recipient}?`;
        }
        return `Send grant notifications for ${rows.length} funded proposals? Each organization will receive one email.`;
    }

    openLastSent(row: GrantProposalEmailRow, event?: Event): void {
        event?.stopPropagation();
        const emailId = row.lastSentEmailId;
        if (!this.meetingId || !emailId) {
            return;
        }
        this.dialog.open(SentGrantEmailViewDialogComponent, {
            width: 'min(960px, 96vw)',
            maxWidth: '96vw',
            maxHeight: '96vh',
            autoFocus: 'dialog',
            data: {
                meetingId: this.meetingId,
                emailId,
            },
        });
    }
}
