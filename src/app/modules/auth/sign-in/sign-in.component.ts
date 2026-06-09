import {
    Component,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { BackendService } from 'app/core/services/backend.service';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';
import { AppConfig, FORCED_APP_SCHEME } from 'app/core/config/app.config';
import { FuseConfigService } from '@fuse/services/config';
import { FuseLoadingService } from '@fuse/services/loading';
import { Subject, takeUntil } from 'rxjs';

@Component({
    standalone: false,
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthSignInComponent implements OnInit, OnDestroy {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: FormGroup;
    showAlert: boolean = false;
    /** True while the login request (and post-login redirect) is in progress. */
    signingIn = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    /** Set when user arrives via /referral?ref=… (query param + localStorage). */
    referralCode: string | null = null;
    referralDirectorName: string | null = null;
    referralLoading = false;
    referralInvalid = false;

    private config: AppConfig;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _referralCodeService: ReferralCodeService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _fuseLoadingService: FuseLoadingService
    ) {}

    ngOnInit(): void {
        this.signInForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        });

        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {
                this.config = config;
            });

        this._loadReferralContext();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    signIn(): void {
        if (this.signInForm.invalid || this.signingIn) {
            return;
        }

        this.signingIn = true;
        this.showAlert = false;
        this.signInForm.disable();
        this._fuseLoadingService.show();

        this._authService.signIn(this.signInForm.value).subscribe({
            next: (response) => {
                if (response.newPassword === true) {
                    this._fuseLoadingService.hide();
                    this.signingIn = false;
                    this.alert = {
                        type: 'success',
                        message: 'A password reset email has been sent. Please create a new password.'
                    };
                    this.showAlert = true;
                    this.signInForm.enable();
                    this.signInNgForm.resetForm();
                } else {
                    this.setScheme();
                    this._backendService.startPing();
                    this._applyPendingReferralCode();
                    const redirectURL = AuthUtils.normalizePostLoginRedirect(
                        this._activatedRoute.snapshot.queryParamMap.get(
                            'redirectURL'
                        )
                    );
                    // Keep loading visible until navigation clears it (empty layout loading bar).
                    this._router.navigateByUrl(redirectURL);
                }
            },
            error: (response) => {
                this._fuseLoadingService.hide();
                this.signingIn = false;

                const errorMessage = response?.error?.error?.[0]?.msg
                    || response?.error?.message
                    || 'An error occurred while signing in.';

                this.signInForm.enable();
                this.signInNgForm.resetForm();

                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };
                this.showAlert = true;
            }
        });
    }

    setScheme(): void {
        this._fuseConfigService.config = { scheme: FORCED_APP_SCHEME };
    }

    private _loadReferralContext(): void {
        const fromUrl = this._activatedRoute.snapshot.queryParamMap.get('ref');
        const fromStorage = this._readStoredReferralCode();
        const code = (fromUrl || fromStorage || '').trim();

        if (!code) {
            return;
        }

        this.referralCode = code;
        this._persistReferralCode(code);

        if (!fromUrl) {
            this._router.navigate([], {
                relativeTo: this._activatedRoute,
                queryParams: { ref: code },
                queryParamsHandling: 'merge',
                replaceUrl: true,
            });
        }

        this.referralLoading = true;
        this._referralCodeService.validateReferralCode(code).subscribe({
            next: (result) => {
                this.referralDirectorName = result?.directorName || null;
                this.referralInvalid = false;
                this.referralLoading = false;
            },
            error: () => {
                this.referralDirectorName = null;
                this.referralInvalid = true;
                this.referralLoading = false;
            },
        });
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

    private _applyPendingReferralCode(): void {
        const stored = localStorage.getItem('referralCode');
        if (!stored) { return; }

        let code: string;
        try {
            const refData = JSON.parse(stored);
            code = refData.code;
        } catch {
            code = stored;
        }

        if (!code) { return; }

        this._referralCodeService.setMyReferralCode(code).subscribe({
            next: () => {
                localStorage.removeItem('referralCode');
            },
            error: () => {
                localStorage.removeItem('referralCode');
            }
        });
    }
}
