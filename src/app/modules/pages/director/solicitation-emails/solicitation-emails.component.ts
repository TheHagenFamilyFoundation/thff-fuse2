import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { SolicitationEmailPreviewDialogComponent } from './solicitation-email-preview-dialog.component';
import { SolicitationPreviewSendDialogComponent } from './solicitation-preview-send-dialog.component';

@Component({
    standalone: false,
    selector: 'app-solicitation-emails',
    templateUrl: './solicitation-emails.component.html',
    styleUrls: ['./solicitation-emails.component.scss']
})
export class SolicitationEmailsComponent implements OnInit {

    readonly sentSolicitationColumns = ['sent', 'to', 'code', 'actions'] as const;

    codes: any[] = [];
    codesLoaded = false;

    solicitationEmails: any[] = [];
    solLoaded = false;
    solResendId: string | null = null;
    viewLoadingId: string | null = null;

    filterReferralCodeId = '';
    /** Submission cycle year (referral code created in this calendar year); '' = all years. */
    filterYear = String(new Date().getFullYear());

    yearFilterOptions: number[] = [];

    pageIndex = 0;
    pageSize = 10;
    totalSolicitations = 0;

    /** Suppress duplicate filter reloads when mat-select emits after enable (same year + code). */
    private _filterSnapshot = '';

    /** True while initial or refreshed list/codes are in flight — drives header progress UI. */
    get pageBusy(): boolean {
        return !this.codesLoaded || !this.solLoaded;
    }

    get loadingMessage(): string {
        if (!this.codesLoaded && !this.solLoaded) {
            return 'Loading referral codes and sent solicitations…';
        }
        if (!this.codesLoaded) {
            return 'Loading referral codes…';
        }
        if (!this.solLoaded) {
            return 'Loading sent solicitations…';
        }
        return '';
    }

    constructor(
        private referralCodeService: ReferralCodeService,
        private outboundEmailService: OutboundEmailService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.rebuildYearFilterOptions();
        this._filterSnapshot = this._currentFilterSnapshot();
        this.loadCodes();
        this.loadSolicitationEmails();
    }

    private _currentFilterSnapshot(): string {
        return `${this.filterYear}|${this.filterReferralCodeId}`;
    }

    loadCodes(): void {
        this.codesLoaded = false;
        this.referralCodeService.getMyReferralCodes().subscribe({
            next: (codes) => {
                this.codes = codes;
                this.rebuildYearFilterOptions();
                this.codesLoaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.codesLoaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    private rebuildYearFilterOptions(): void {
        const set = new Set<number>();
        const cy = new Date().getFullYear();
        for (let i = 0; i <= 10; i++) {
            set.add(cy - i);
        }
        for (const c of this.codes) {
            if (c?.createdAt) {
                set.add(new Date(c.createdAt).getFullYear());
            }
        }
        this.yearFilterOptions = Array.from(set).sort((a, b) => b - a);
    }

    loadSolicitationEmails(): void {
        this.solLoaded = false;
        const ref = this.filterReferralCodeId || undefined;
        const year = this.filterYear || undefined;
        this.outboundEmailService
            .getMySolicitationEmails(ref, this.pageIndex + 1, this.pageSize, year)
            .subscribe({
                next: (res) => {
                    const items = res?.items || [];
                    this.totalSolicitations = res?.total ?? 0;
                    if (items.length === 0 && this.totalSolicitations > 0 && this.pageIndex > 0) {
                        this.pageIndex = 0;
                        this.loadSolicitationEmails();
                        return;
                    }
                    this.solicitationEmails = items;
                    this.solLoaded = true;
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.solLoaded = true;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onFilterChange(): void {
        const snap = this._currentFilterSnapshot();
        if (snap === this._filterSnapshot) {
            return;
        }
        this._filterSnapshot = snap;
        this.pageIndex = 0;
        this.loadSolicitationEmails();
    }

    onPageChange(ev: PageEvent): void {
        if (ev.pageIndex === this.pageIndex && ev.pageSize === this.pageSize) {
            return;
        }
        this.pageIndex = ev.pageIndex;
        this.pageSize = ev.pageSize;
        this.loadSolicitationEmails();
    }

    openSendSolicitation(): void {
        this.referralCodeService.getMyReferralCodes().subscribe({
            next: (codes) => {
                this.codes = codes || [];
                this.rebuildYearFilterOptions();
                this.codesLoaded = true;
                if (!this.codes.length) {
                    this.snackBar.open('Create a referral code on Referral links first', 'OK', { duration: 4000 });
                    return;
                }
                this.dialog
                    .open(SolicitationPreviewSendDialogComponent, {
                        width: '680px',
                        maxWidth: '96vw',
                        autoFocus: false,
                        data: {
                            codes: this.codes
                        }
                    })
                    .afterClosed()
                    .subscribe((sent) => {
                        if (sent) {
                            this.pageIndex = 0;
                            this.loadSolicitationEmails();
                            this.loadCodes();
                        }
                    });
            },
            error: () => {
                this.codesLoaded = true;
                this._changeDetectorRef.markForCheck();
                this.snackBar.open('Could not load referral codes', 'OK', { duration: 4000 });
            }
        });
    }

    viewSolicitation(row: any): void {
        const id = row?._id;
        if (!id) {
            return;
        }
        this.viewLoadingId = String(id);
        this.outboundEmailService.getSolicitationEmailById(String(id)).subscribe({
            next: (doc) => {
                this.viewLoadingId = null;
                this.dialog.open(SolicitationEmailPreviewDialogComponent, {
                    width: '720px',
                    maxWidth: '95vw',
                    data: {
                        subject: doc?.subject,
                        to: doc?.to,
                        html: doc?.htmlBody || null,
                        missingPreview: !doc?.htmlBody
                    }
                });
            },
            error: () => {
                this.viewLoadingId = null;
                this.snackBar.open('Could not load email preview', 'OK', { duration: 4000 });
            }
        });
    }

    resendSolicitation(row: any): void {
        this.solResendId = row._id;
        this.outboundEmailService.resendSolicitationEmail(row._id).subscribe({
            next: () => {
                this.solResendId = null;
                this.snackBar.open('Email resent', 'OK', { duration: 3000 });
                this.loadSolicitationEmails();
            },
            error: (err) => {
                this.solResendId = null;
                const msg = err?.error?.message || 'Failed to resend';
                this.snackBar.open(msg, 'OK', { duration: 5000 });
            }
        });
    }

    codeLabel(e: any): string {
        const rc = e?.referralCode;
        if (!rc) return '—';
        const base = rc.label ? `${rc.code} (${rc.label})` : rc.code;
        const raw = rc.createdAt;
        if (!raw) return base;
        const y = new Date(raw).getFullYear();
        return `${base} · ${y} cycle`;
    }
}
