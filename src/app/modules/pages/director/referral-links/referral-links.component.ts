import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReferralCodeService } from 'app/core/services/director/referral-code.service';

@Component({
    standalone: false,
    selector: 'app-referral-links',
    templateUrl: './referral-links.component.html',
    styleUrls: ['./referral-links.component.scss']
})
export class ReferralLinksComponent implements OnInit {

    codes: any[] = [];
    loaded = false;
    newLabel = '';
    feUrl: string;

    constructor(
        private referralCodeService: ReferralCodeService,
        private snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.feUrl = window.location.origin;
    }

    ngOnInit(): void {
        this.loadCodes();
    }

    loadCodes(): void {
        this.loaded = false;
        this.referralCodeService.getMyReferralCodes().subscribe({
            next: (codes) => {
                this.codes = Array.isArray(codes) ? codes : [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            },
            error: (err) => {
                console.error('Error loading referral codes', err);
                this.codes = [];
                this.loaded = true;
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    createCode(): void {
        this.referralCodeService.createReferralCode(this.newLabel).subscribe({
            next: (code) => {
                this.codes = [code, ...this.codes];
                this.newLabel = '';
                this.snackBar.open('Referral code created', 'OK', { duration: 3000 });
                this._changeDetectorRef.markForCheck();
            },
            error: (err) => {
                console.error('Error creating referral code', err);
                this.snackBar.open('Error creating code', 'OK', { duration: 3000 });
            }
        });
    }

    toggleCode(code: any): void {
        this.referralCodeService.toggleReferralCode(code._id).subscribe({
            next: (updated) => {
                code.active = updated.active;
                const msg = updated.active ? 'Code activated' : 'Code deactivated';
                this.snackBar.open(msg, 'OK', { duration: 3000 });
                this._changeDetectorRef.markForCheck();
            },
            error: (err) => {
                console.error('Error toggling code', err);
            }
        });
    }

    getLink(code: string): string {
        return `${this.feUrl}/referral?ref=${code}`;
    }

    copyLink(code: string): void {
        const link = this.getLink(code);
        navigator.clipboard.writeText(link).then(() => {
            this.snackBar.open('Link copied to clipboard', 'OK', { duration: 2000 });
        });
    }

    copyCode(code: string): void {
        navigator.clipboard.writeText(code).then(() => {
            this.snackBar.open('Code copied to clipboard', 'OK', { duration: 2000 });
        });
    }
}
