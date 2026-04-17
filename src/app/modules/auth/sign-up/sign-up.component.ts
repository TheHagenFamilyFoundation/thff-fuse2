import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseConfigService } from '@fuse/services/config';
import { AuthService } from 'app/core/auth/auth.service';
import { BackendService } from 'app/core/services/backend.service';
import { Scheme } from 'app/core/config/app.config';

@Component({
    standalone: false,
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: FormGroup;
    showAlert: boolean = false;

    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    constructor(
        private _authService: AuthService,
        private _backendService: BackendService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _route: ActivatedRoute,
        private _fuseConfigService: FuseConfigService
    ) {}

    ngOnInit(): void {
        this.signUpForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        });

        // Old referral links point to /sign-up?ref=CODE — redirect to the new /referral route
        this._route.queryParams.subscribe((params) => {
            if (params.ref) {
                this._router.navigate(['/referral'], { queryParams: { ref: params.ref } });
            }
        });
    }

    signUp(): void {
        if (this.signUpForm.invalid) {
            return;
        }

        this.signUpForm.disable();
        this.showAlert = false;

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
        }

        this._authService.signUp(payload).subscribe({
            next: (response) => {
                // Establish session from the register response
                this._authService.establishSession(response);

                // Apply user's default scheme
                if (response.userSettings?.scheme) {
                    this._fuseConfigService.config = { scheme: response.userSettings.scheme as Scheme };
                }

                // Start backend session ping
                this._backendService.startPing();

                // Referral code is now on the User record — clean up localStorage
                localStorage.removeItem('referralCode');

                // Navigate to the app
                this._router.navigateByUrl('/signed-in-redirect');
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
