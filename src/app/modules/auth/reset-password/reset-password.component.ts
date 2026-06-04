import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseValidators } from '@fuse/validators';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { FuseLoadingService } from '@fuse/services/loading';

@Component({
    standalone: false,
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthResetPasswordComponent implements OnInit, OnDestroy {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    countdown: number = 1;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: FormGroup;
    showAlert: boolean = false;
    resettingPassword = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    private resetCode: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _route: ActivatedRoute,
        private _fuseLoadingService: FuseLoadingService
    ) {}

    ngOnInit(): void {
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch('password', 'passwordConfirm'),
            }
        );

        this._route.queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((params) => {
                this.resetCode = params.rc;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    resetPassword(): void {
        if (this.resetPasswordForm.invalid || this.resettingPassword) {
            return;
        }

        this.resettingPassword = true;
        this.resetPasswordForm.disable();
        this.showAlert = false;
        this._fuseLoadingService.show();

        const passwordPayload = {
            np: this.resetPasswordForm.get('password').value,
            rc: this.resetCode,
        };

        this._authService
            .resetPassword(passwordPayload)
            .pipe(
                finalize(() => {
                    this._fuseLoadingService.hide();
                    this.resettingPassword = false;
                    this.resetPasswordForm.enable();
                    this.resetPasswordNgForm.resetForm();
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: () => {
                    this.alert = {
                        type: 'success',
                        message: 'Your password has been reset. Redirecting to sign in...',
                    };

                    timer(1000, 1000)
                        .pipe(
                            finalize(() => {
                                this._router.navigate(['sign-in']);
                            }),
                            takeWhile(() => this.countdown > 0),
                            takeUntil(this._unsubscribeAll),
                            tap(() => this.countdown--)
                        )
                        .subscribe();
                },
                error: (response) => {
                    const errorMessage = response?.error?.error?.[0]?.msg
                        || response?.error?.message
                        || 'An error occurred. Please try again.';

                    this.alert = {
                        type: 'error',
                        message: errorMessage,
                    };
                }
            });
    }
}
