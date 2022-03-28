import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';

import { AuthService } from 'app/core/auth/auth.service';
@Component({
    selector: 'auth-confirmation',
    templateUrl: './confirmation.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthConfirmationComponent implements OnInit {
    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    confirmCode: string;

    countdown: number = 1;

    alert: any;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _router: Router,
        private route: ActivatedRoute
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.confirmCode = params.code; // (+) converts string 'id' to a number

            //TODO: delete
            console.log('this.confirmCode');
            console.log(this.confirmCode);
        });

        this.checkConfirmCode();
    }

    checkConfirmCode(): void {
        console.log('checking confirm code');
        console.log('this.confirmCode');
        console.log(this.confirmCode);

        // Send the request to the server
        this._authService
            .confirmUser(this.confirmCode)
            .pipe(
                finalize(() => {
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
                })
            )
            .subscribe(
                (response) => {
                    console.log(response);

                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: response.message,
                    };
                },
                (response) => {
                    console.log(response);

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.message,
                    };
                }
            );

        // this._router.navigate(['/sign-in']);
    }
}
