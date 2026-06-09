import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { thffEmailValidator, validateEmailControlOnBlur } from 'app/core/auth/auth-validators';
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

    recipientEmailControl = new FormControl('', [Validators.required, thffEmailValidator]);

    messagePlain = DEFAULT_SOLICITATION_MESSAGE_PLAIN;

    step = STEP_CODE;

    previewLoading = false;
    previewError: string | null = null;
    trustedPreview: SafeHtml | null = null;

    sending = false;

    /** Step 2 loads default letter from server; keep UX responsive if preview API is slow. */
    messageSyncing = false;

    private previewDebounce: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private dialogRef: MatDialogRef<SolicitationPreviewSendDialogComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) data: SolicitationPreviewSendDialogData,
        private outboundEmailService: OutboundEmailService,
        private sanitizer: DomSanitizer,
        private snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.codes = data.codes || [];
        this.referralCodeId = this.normalizeReferralCodeId(data.referralCodeId);
        this.recipientEmailControl.setValue(data.to || '');
    }

    /** Mat-select / API may expose _id as a string or as `{ $oid: string }`. */
    private normalizeReferralCodeId(id: unknown): string {
        if (id == null || id === '') {
            return '';
        }
        if (typeof id === 'object' && id !== null && '$oid' in (id as object)) {
            return String((id as { $oid: string }).$oid);
        }
        return String(id);
    }

    ngOnInit(): void {
        if (this.referralCodeId) {
            this.step = STEP_EDIT;
            this.syncPlainFromServer();
        } else {
            this.step = STEP_CODE;
            if (this.codes.length > 0) {
                this.referralCodeId = this.normalizeReferralCodeId(this.codes[0]._id);
            }
        }
    }

    ngOnDestroy(): void {
        if (this.previewDebounce) {
            clearTimeout(this.previewDebounce);
        }
    }

    private syncPlainFromServer(onDone?: () => void): void {
        const refId = this.normalizeReferralCodeId(this.referralCodeId);
        if (!refId) {
            onDone?.();
            return;
        }
        this.messageSyncing = true;
        this.outboundEmailService
            .previewSolicitation({
                referralCodeId: refId
            })
            .subscribe({
                next: (res) => {
                    this.messageSyncing = false;
                    const fromApi = res?.plainText;
                    if (typeof fromApi === 'string') {
                        this.messagePlain = fromApi;
                    }
                    this.referralCodeId = refId;
                    onDone?.();
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.messageSyncing = false;
                    /* keep DEFAULT_SOLICITATION_MESSAGE_PLAIN */
                    this.referralCodeId = refId;
                    onDone?.();
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    private static escapeHtml(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private setTrustedPreviewFromResponse(res: { html?: string; plainText?: string }): void {
        const html = res?.html;
        if (html != null && String(html).trim() !== '') {
            this.trustedPreview = this.sanitizer.bypassSecurityTrustHtml(String(html));
            return;
        }
        const plain = res?.plainText;
        if (typeof plain === 'string' && plain.trim() !== '') {
            const safe = SolicitationPreviewSendDialogComponent.escapeHtml(plain).replace(/\n/g, '<br>');
            this.trustedPreview = this.sanitizer.bypassSecurityTrustHtml(
                `<div class="email-preview-surface">${safe}</div>`
            );
            return;
        }
        this.trustedPreview = this.sanitizer.bypassSecurityTrustHtml(
            '<p class="email-preview-surface text-gray-500">(Preview has no content)</p>'
        );
    }

    private runPreview(useServerDefault: boolean, onSuccess?: () => void): void {
        if (this.previewDebounce) {
            clearTimeout(this.previewDebounce);
            this.previewDebounce = null;
        }

        const refId = this.normalizeReferralCodeId(this.referralCodeId);
        if (!refId) {
            this.previewLoading = false;
            this.previewError = 'Referral code is missing';
            this._changeDetectorRef.markForCheck();
            return;
        }

        this.previewLoading = true;
        this.previewError = null;
        this.trustedPreview = null;

        const body: {
            referralCodeId: string;
            messagePlain?: string;
        } = {
            referralCodeId: refId
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
                this.setTrustedPreviewFromResponse(res);
                onSuccess?.();
                this._changeDetectorRef.markForCheck();
            },
            error: (err) => {
                this.previewLoading = false;
                this.previewError = err?.error?.message || 'Could not build preview';
                this._changeDetectorRef.markForCheck();
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

    /** Stable string id for mat-option [value] and comparisons. */
    codeOptionValue(code: any): string {
        return this.normalizeReferralCodeId(code?._id);
    }

    selectedReferralCode(): any | null {
        const id = this.normalizeReferralCodeId(this.referralCodeId);
        return this.codes.find((c) => this.codeOptionValue(c) === id) || null;
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
        const id = this.normalizeReferralCodeId(this.referralCodeId);
        if (!id) {
            this.snackBar.open('Choose a referral code', 'OK', { duration: 3000 });
            return;
        }
        this.referralCodeId = id;
        this.previewError = null;
        /* Advance immediately — previously step changed only after preview HTTP, so a hung/failed request looked like a dead button. */
        this.step = STEP_EDIT;
        this._changeDetectorRef.markForCheck();
        this.syncPlainFromServer();
    }

    goToPreview(): void {
        const refId = this.normalizeReferralCodeId(this.referralCodeId);
        if (!refId) {
            this.snackBar.open('Choose a referral code', 'OK', { duration: 3000 });
            return;
        }
        this.referralCodeId = refId;
        this.previewError = null;
        this.trustedPreview = null;
        /* Same as edit step: don’t wait on HTTP before showing the next screen (spinner lives on preview). */
        this.step = STEP_PREVIEW;
        this._changeDetectorRef.markForCheck();
        this.runPreview(false);
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

    onRecipientEmailBlur(): void {
        validateEmailControlOnBlur(this.recipientEmailControl);
        this._changeDetectorRef.markForCheck();
    }

    send(): void {
        this.recipientEmailControl.markAsTouched();
        this.recipientEmailControl.updateValueAndValidity();
        if (this.recipientEmailControl.invalid) {
            this._changeDetectorRef.markForCheck();
            return;
        }

        const email = String(this.recipientEmailControl.value ?? '').trim();
        if (this.previewLoading) {
            return;
        }

        const refId = this.normalizeReferralCodeId(this.referralCodeId);
        if (!refId) {
            this.snackBar.open('Choose a referral code', 'OK', { duration: 3000 });
            return;
        }

        this.sending = true;
        this.outboundEmailService
            .sendSolicitationEmail({
                referralCodeId: refId,
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
