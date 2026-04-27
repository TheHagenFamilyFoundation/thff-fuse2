import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

@Component({
    standalone: false,
    selector: 'landing-home',
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent implements OnInit {
    latestSubmissionYear: any;
    portalOpen: boolean = false;
    loading: boolean = true;

    /**
     * Constructor
     */
    constructor(
        private _router: Router, 
        private _authService: AuthService,
        private _submissionYearsService: SubmissionYearsService
    ) {
    }

    ngOnInit(): void {
        this.getLatestSubmissionYear();
    }

    getLatestSubmissionYear(): void {
        this.loading = true;
        this._submissionYearsService.getLatestSubmissionYear()
            .subscribe({
                next: (year) => {
                    this.latestSubmissionYear = year;
                    if (year) {
                        this.portalOpen = year.active;
                    }
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    // Don't let errors propagate to avoid triggering reload loops
                    // Set default values if API call fails
                    this.latestSubmissionYear = null;
                    this.portalOpen = false;
                }
            });
    }
}
