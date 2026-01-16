import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

@Component({
    selector     : 'welcome',
    templateUrl  : './welcome.component.html',
    encapsulation: ViewEncapsulation.None
})
export class WelcomeComponent implements OnInit
{
    latestSubmissionYear: any;
    portalOpen: boolean = false;
    loading: boolean = true;

    /**
     * Constructor
     */
    constructor(private _submissionYearsService: SubmissionYearsService)
    {
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
                    console.log('getLatestSubmissionYear - year', year);
                },
                error: (err) => {
                    console.log('getLatestSubmissionYear - err', err);
                    this.loading = false;
                    // Don't let errors propagate to avoid triggering reload loops
                    // Set default values if API call fails
                    this.latestSubmissionYear = null;
                    this.portalOpen = false;
                }
            });
    }
}
