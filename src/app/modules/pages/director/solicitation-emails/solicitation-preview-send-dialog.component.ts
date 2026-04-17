import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OutboundEmailService } from 'app/core/services/director/outbound-email.service';
import { DEFAULT_SOLICITATION_MESSAGE_PLAIN } from './solicitation-default-message';

export interface SolicitationPreviewSendDialogData {
    /** Your active referral codes (from Referral links). */
    codes: any[];
    referralCodeId?: string;
    to?: string;
}

/** 0 = choose code, 1 = edit, 2 = preview, 3 = send */
const STEP_CODE = 0;
const STEP_EDIT = 1;
const STEP_PREVIEW = 2;
const STEP_SEND = 3;

@Component({
    standalone: false,
    selector: 'app-solicitation-preview-send-dialog',
    templateUrl: './solicitation-preview-send-dialog.component.html',
    styleUrls: ['./solicitation-preview-send-dialog.component.scss']
})
export class SolicitationPreviewSendDialogComponent implements OnInit, OnDestroy {

    readonly STEP_CODE = STEP_CODE;
    readonly STEP_EDIT = STEP_EDIT;
    readonly STEP_PREVIEW = STEP_PREVIEW;
    readonly STEP_SEND = STEP_SEND;

    codes: any[] = [];

    referralCodeId = '';
    to = '';

    messagePlain = DEFAULT_SOLICITATION_MESSAGE_PLAIN;

    step = STEP_CODE;

    previewLoading = false;
    previewError: string | null = null;
    trustedPreview: SafeHtml | null = null;

    sending = false;

    private previewDebounce: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private dialogRef: MatDialogRef<SolicitationPreviewSendDialogComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) data: SolicitationPreviewSendDialogData,
        private outboundEmailService: OutboundEmailService,
        private sanitizer: DomSanitizer,
        private snackBar: MatSnackBar
    ) {
        this.codes = data.codes || [];
        this.referralCodeId = data.referralCodeId || '';
        this.to = data.to || '';
    }

    ngOnInit(): void {
        if (this.referralCodeId) {
            this.step = STEP_EDIT;
            this.syncPlainFromServer();
        } else {
            this.step = STEP_CODE;
            if (this.codes.length > 0) {
                this.referralCodeId = this.codes[0]._id;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.previewDebounce) {
            clearTimeout(this.previewDebounce);
        }
    }

    private syncPlainFromServer(onDone?: () => void): void {
        this.outboundEmailService
            .previewSolicitation({
                referralCodeId: this.referralCodeId
            })
            .subscribe({
                next: (res) => {
                    const fromApi = res?.plainText;
                    if (typeof fromApi === 'string') {
                        this.messagePlain = fromApi;
                    }
                    onDone?.();
                },
                error: () => {
                    /* keep DEFAULT_SOLICITATION_MESSAGE_PLAIN */
                    onDone?.();
                }
            });
    }

    private runPreview(useServerDefault: boolean, onSuccess?: () => void): void {
        if (this.previewDebounce) {
            clearTimeout(this.previewDebounce);
            this.previewDebounce = null;
        }

        this.previewLoading = true;
        this.previewError = null;
        this.trustedPreview = null;

        const body: {
            referralCodeId: string;
            messagePlain?: string;
        } = {
            referralCodeId: this.referralCodeId
        };
        if (!useServerDefault) {
            body.messagePlain = this.messagePlain;
        }

        this.outboundEmailService.previewSolicitation(body).subscribe({
            next: (res) => {
                this.previewLoading = false;
                const fromApi = res?.plainText;
                if (typeof fromApi === 'string') {
                    this.messagePlain = fromApi;
                } else if (useServerDefault) {
                    this.messagePlain = DEFAULT_SOLICITATION_MESSAGE_PLAIN;
                }
                if (res?.html) {
                    this.trustedPreview = this.sanitizer.bypassSecurityTrustHtml(res.html);
                }
                onSuccess?.();
            },
            error: (err) => {
                this.previewLoading = false;
                this.previewError = err?.error?.message || 'Could not build preview';
            }
        });
    }

    /** Submission cycle year for a referral code (THFF codes roll over at calendar year end). */
    codeSubmissionYear(code: any): number | null {
        const raw = code?.createdAt;
        if (!raw) {
            return null;
        }
        return new Date(raw).getFullYear();
    }

    selectedReferralCode(): any | null {
        return this.codes.find((c) => c._id === this.referralCodeId) || null;
    }

    /** From getMyReferralCodes: solicitation sends + applicants who linked this code string on their account. */
    codeUsage(code: any): { sent: number; lastAt: Date | null; linked: number } {
        return {
            sent: code?.solicitationEmailsSent ?? 0,
            lastAt: code?.lastSolicitationSentAt ? new Date(code.lastSolicitationSentAt) : null,
            linked: code?.linkedAccountsUsingCode ?? 0
        };
    }

    goToEditFromCode(): void {
        if (!this.referralCodeId) {
            this.snackBar.open('Choose a referral code', 'OK', { duration: 3000 });
            return;
        }
        this.previewError = null;
        this.syncPlainFromServer(() => {
            this.step = STEP_EDIT;
        });
    }

    goToPreview(): void {
        this.previewError = null;
        this.runPreview(false, () => {
            this.previewError = null;
            this.step = STEP_PREVIEW;
        });
    }

    goToSend(): void {
        this.step = STEP_SEND;
    }

    back(): void {
        if (this.step === STEP_PREVIEW) {
            this.step = STEP_EDIT;
        } else if (this.step === STEP_SEND) {
            this.step = STEP_PREVIEW;
        } else if (this.step === STEP_EDIT) {
            this.step = STEP_CODE;
        }
    }

    onPlainInput(): void {
        /* preview runs on Next */
    }

    reloadDefaultText(): void {
        this.runPreview(true);
    }

    send(): void {
        const email = (this.to || '').trim();
        if (!email) {
            this.snackBar.open('Recipient email is required', 'OK', { duration: 3000 });
            return;
        }
        if (this.previewLoading) {
            return;
        }

        this.sending = true;
        this.outboundEmailService
            .sendSolicitationEmail({
                referralCodeId: this.referralCodeId,
                to: email,
                messagePlain: this.messagePlain
            })
            .subscribe({
                next: () => {
                    this.sending = false;
                    this.snackBar.open('Email sent', 'OK', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.sending = false;
                    this.snackBar.open(err?.error?.message || 'Failed to send', 'OK', { duration: 5000 });
                }
            });
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
