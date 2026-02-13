import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';

import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    countdown: number = 3;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: FormGroup;
    showAlert: boolean = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router
    ) {}

    ngOnInit(): void {
        this.signUpForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    signUp(): void {
        if (this.signUpForm.invalid) {
            return;
        }

        this.signUpForm.disable();
        this.showAlert = false;

        this._authService.signUp(this.signUpForm.value).subscribe({
            next: () => {
                this.alert = {
                    type: 'success',
                    message: 'Account created successfully!',
                };
                this.showAlert = true;

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
                    || 'An error occurred while creating your account.';

                this.signUpForm.enable();
                this.signUpNgForm.resetForm();

                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };
                this.showAlert = true;
            }
        });
    }
}
