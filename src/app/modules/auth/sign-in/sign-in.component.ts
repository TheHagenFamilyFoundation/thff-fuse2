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
import { BackendService } from 'app/core/services/backend.service';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';
import { AppConfig, Scheme } from 'app/core/config/app.config';
import { FuseConfigService } from '@fuse/services/config';
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

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    private config: AppConfig;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _referralCodeService: ReferralCodeService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _fuseConfigService: FuseConfigService
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
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    signIn(): void {
        if (this.signInForm.invalid) {
            return;
        }

        this.signInForm.disable();
        this.showAlert = false;

        this._authService.signIn(this.signInForm.value).subscribe({
            next: (response) => {
                if (response.newPassword === true) {
                    this.alert = {
                        type: 'success',
                        message: 'A password reset email has been sent. Please create a new password.'
                    };
                    this.showAlert = true;
                    this.signInForm.enable();
                    this.signInNgForm.resetForm();
                } else {
                    this.setScheme(response.userSettings.scheme);
                    this._backendService.startPing();
                    this._applyPendingReferralCode();
                    const redirectURL =
                        this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                    this._router.navigateByUrl(redirectURL);
                }
            },
            error: (response) => {
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

    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
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
