import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize, take, timeout } from 'rxjs/operators';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

/** Max wait for the public submission-year call on the landing page. */
const API_WAIT_MS = 12000;

@Component({
    standalone: false,
    selector: 'landing-home',
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent implements OnInit, OnDestroy {
    latestSubmissionYear: any;
    portalOpen: boolean = false;
    loading: boolean = true;

    private _destroyed = false;

    constructor(
        private _submissionYearsService: SubmissionYearsService,
        private _cdr: ChangeDetectorRef,
    ) {
    }

    ngOnInit(): void {
        this.getLatestSubmissionYear();
    }

    ngOnDestroy(): void {
        this._destroyed = true;
    }

    getLatestSubmissionYear(): void {
        this.loading = true;

        this._submissionYearsService
            .getLatestSubmissionYear()
            .pipe(
                take(1),
                timeout({ first: API_WAIT_MS }),
                catchError((err) => {
                    console.error('Home: getLatestSubmissionYear failed', err);
                    return of(null);
                }),
                finalize(() => {
                    if (!this._destroyed) {
                        this.loading = false;
                        this._cdr.detectChanges();
                    }
                })
            )
            .subscribe((year) => {
                this.latestSubmissionYear = year;
                this.portalOpen = !!year?.active;
            });
    }
}
