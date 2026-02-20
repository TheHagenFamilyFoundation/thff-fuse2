import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';

@Component({
    selector: 'app-referral',
    templateUrl: './referral.component.html',
})
export class ReferralComponent implements OnInit {
    sponsorName: string = '';
    loading: boolean = true;
    error: string = '';
    isLoggedIn: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private referralCodeService: ReferralCodeService
    ) {}

    ngOnInit(): void {
        const code = this.route.snapshot.queryParamMap.get('ref');

        if (!code) {
            this.router.navigate(['/home']);
            return;
        }

        // Check if the user is logged in by looking for an access token
        if (this.authService.accessToken) {
            this.isLoggedIn = true;
            this.applyCodeToAccount(code);
        } else {
            this.storeAndRedirect(code);
        }
    }

    private applyCodeToAccount(code: string): void {
        this.referralCodeService.setMyReferralCode(code).subscribe({
            next: (result) => {
                this.loading = false;
                this.sponsorName = result.sponsor.name;

                setTimeout(() => {
                    this.router.navigate(['/welcome']);
                }, 3000);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'This referral code is invalid or expired.';

                setTimeout(() => {
                    this.router.navigate(['/welcome']);
                }, 3000);
            }
        });
    }

    private storeAndRedirect(code: string): void {
        const refData = {
            code,
            year: new Date().getFullYear()
        };
        localStorage.setItem('referralCode', JSON.stringify(refData));

        this.router.navigate(['/sign-in']);
    }
}
