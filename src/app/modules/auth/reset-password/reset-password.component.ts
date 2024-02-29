import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseValidators } from '@fuse/validators';
import { FuseAlertType } from '@fuse/components/alert';

import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;
    countdown: number = 1;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: FormGroup;
    showAlert: boolean = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    resetCode: string;
    resetCodeValid: boolean = false;
    checkedResetCode: boolean = false;

    validPasswordReset: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private route: ActivatedRoute,
        public snackBar: MatSnackBar
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch(
                    'password',
                    'passwordConfirm'
                ),
            }
        );
        this.route.queryParams.subscribe((params) => {
            this.resetCode = params.rc; // (+) converts string 'id' to a number

            //TODO: delete
            console.log('this.resetCode');
            console.log(this.resetCode);
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Reset password
     */
    resetPassword(): void {
        console.log('trying to reset password');

        // Return if the form is invalid
        if (this.resetPasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.resetPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        const passwordPayload = {
            np: this.resetPasswordForm.get('password').value,
            rc: this.resetCode,
        };
        // Send the request to the server
        this._authService
            .resetPassword(passwordPayload)
            .pipe(
                finalize(() => {
                    // Re-enable the form
                    this.resetPasswordForm.enable();

                    // Reset the form
                    this.resetPasswordNgForm.resetForm();

                    // Show the alert
                    this.showAlert = true;

                })
            )
            .subscribe(
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: 'Your password has been reset. Redirecting to Sign in',
                    };

                    // Redirect after the countdown
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
                (response) => {
                    console.log(response);

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.error[0].msg,
                    };

                    // Redirect after the countdown
                    timer(1000, 1000)
                        .pipe(
                            finalize(() => {

                                this.showAlert = false;
                            }),
                            takeWhile(() => this.countdown > 0),
                            takeUntil(this._unsubscribeAll),
                            tap(() => this.countdown--)
                        )
                        .subscribe();

                }
            );
    }

    //TODO: remove
    // async checkResetCode(): Promise<void> {
    //     console.log('checking the reset code', this.resetCode);
    //     const started = Date.now();
    //     let ok: string;

    //     // Send the request to the server

    //     // const http$ = this._authService.checkResetCode(this.resetCode);
    //     // const value = await firstValueFrom(http$);
    //     // console.log(value);

    //     this._authService.checkResetCode(this.resetCode).subscribe(
    //         (res) => {
    //             console.log('HTTP response', res);
    //             if (!res) {
    //                 this._router.navigate(['sign-in']);
    //             }
    //         },
    //         (err) => {
    //             console.log('HTTP Error', err);
    //         },
    //         () => {
    //             console.log('HTTP request completed.');
    //             this.checkedResetCode = true;
    //         }
    //     );
    // }
}
