import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { thffEmailValidator, validateEmailOnBlur } from 'app/core/auth/auth-validators';
import {
    getThffPasswordRuleStates,
    thffPasswordValidator,
    ThffPasswordRuleState,
} from 'app/core/auth/password-validators';
import { Router, ActivatedRoute } from '@angular/router';

import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseConfigService } from '@fuse/services/config';
import { FuseLoadingService } from '@fuse/services/loading';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { BackendService } from 'app/core/services/backend.service';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
    standalone: false,
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: FormGroup;
    showAlert: boolean = false;
    signingUp = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    referralCode: string | null = null;
    referralDirectorName: string | null = null;
    referralLoading = false;
    referralInvalid = false;
    referralValid = false;

    passwordFocused = false;
    passwordRuleStates: ThffPasswordRuleState[] = getThffPasswordRuleStates('');

    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _authService: AuthService,
        private _backendService: BackendService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _route: ActivatedRoute,
        private _referralCodeService: ReferralCodeService,
        private _fuseConfigService: FuseConfigService,
        private _fuseLoadingService: FuseLoadingService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.signUpForm = this._formBuilder.group({
            email: ['', [Validators.required, thffEmailValidator]],
            password: ['', [Validators.required, thffPasswordValidator]],
        });

        this.signUpForm
            .get('password')
            ?.valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                this.passwordRuleStates = getThffPasswordRuleStates(value);
            });

        this._loadReferralContext();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    signUp(): void {
        if (this.signUpForm.invalid || this.signingUp) {
            this.signUpForm.markAllAsTouched();
            return;
        }

        this.signingUp = true;
        this.signUpForm.disable();
        this.showAlert = false;
        this._fuseLoadingService.show();

        const payload: any = { ...this.signUpForm.value };

        // Attach referral code from localStorage so it's persisted on the user record
        const stored = localStorage.getItem('referralCode');
        if (stored) {
            try {
                const refData = JSON.parse(stored);
                if (refData.code) {
                    payload.referralCode = refData.code;
                }
            } catch {
                // Legacy plain-string format
                payload.referralCode = stored;
            }
        } else if (this.referralCode) {
            payload.referralCode = this.referralCode;
        }

        this._authService.signUp(payload).subscribe({
            next: (response) => {
                // Establish session from the register response
                this._authService.establishSession(response);

                this._fuseConfigService.config = { scheme: 'light' };

                // Proactive JWT refresh while the app is open
                this._backendService.startPing();

                // Referral code is now on the User record — clean up localStorage
                localStorage.removeItem('referralCode');

                // Navigate to the app
                this._router.navigateByUrl('/signed-in-redirect');
            },
            error: (response) => {
                this._fuseLoadingService.hide();
                this.signingUp = false;

                const errorMessage = AuthUtils.getAuthErrorMessage(
                    response,
                    'An error occurred while creating your account.'
                );

                this._restoreSignUpFormAfterError();
                AuthUtils.applyFieldValidationErrors(this.signUpForm, response);

                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };
                this.showAlert = true;
            }
        });
    }

    /** Validate email when the user leaves the field (e.g. Tab to password). */
    onEmailBlur(): void {
        validateEmailOnBlur(this.signUpForm);
    }

    /** Keep email on failed registration; clear password so the user can retry. */
    private _restoreSignUpFormAfterError(): void {
        const email = this.signUpForm.get('email')?.value ?? '';
        this.signUpForm.enable();
        this.signUpForm.patchValue({ email, password: '' });
        this.signUpForm.get('password')?.markAsTouched();
    }

    private _loadReferralContext(): void {
        const fromUrl = this._route.snapshot.queryParamMap.get('ref');
        const fromStorage = this._readStoredReferralCode();
        const code = (fromUrl || fromStorage || '').trim();

        if (!code) {
            return;
        }

        this.referralCode = code;
        this._persistReferralCode(code);

        this.referralLoading = true;
        this.referralInvalid = false;
        this.referralValid = false;
        this.referralDirectorName = null;

        this._referralCodeService
            .validateReferralCode(code)
            .pipe(
                finalize(() => {
                    this.referralLoading = false;
                    this._changeDetectorRef.markForCheck();
                }),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe({
                next: (result) => {
                    this.referralDirectorName = this._extractDirectorName(result);
                    this.referralValid =
                        result?.valid === true ||
                        (!!this.referralDirectorName && result?.valid !== false);
                    this.referralInvalid = !this.referralValid && !this.referralDirectorName;
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.referralDirectorName = null;
                    this.referralValid = false;
                    this.referralInvalid = true;
                    this._changeDetectorRef.markForCheck();
                },
            });
    }

    private _extractDirectorName(result: Record<string, unknown> | null | undefined): string | null {
        if (!result) {
            return null;
        }

        const direct =
            result['directorName'] ??
            result['director_name'] ??
            result['name'];

        if (typeof direct === 'string' && direct.trim()) {
            return direct.trim();
        }

        const director = result['director'];
        if (director && typeof director === 'object') {
            const d = director as Record<string, unknown>;
            const first = String(d['firstName'] ?? d['first_name'] ?? '').trim();
            const last = String(d['lastName'] ?? d['last_name'] ?? '').trim();
            const full = `${first} ${last}`.trim();
            if (full) {
                return full;
            }
            const email = d['email'];
            if (typeof email === 'string' && email.trim()) {
                return email.trim();
            }
        }

        return null;
    }

    private _readStoredReferralCode(): string | null {
        const stored = localStorage.getItem('referralCode');
        if (!stored) {
            return null;
        }
        try {
            const refData = JSON.parse(stored);
            return refData?.code ? String(refData.code) : null;
        } catch {
            return stored;
        }
    }

    private _persistReferralCode(code: string): void {
        localStorage.setItem(
            'referralCode',
            JSON.stringify({ code, year: new Date().getFullYear() })
        );
    }
}
