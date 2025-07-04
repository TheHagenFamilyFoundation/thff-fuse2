import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';
@Component({
    selector: 'app-proposals',
    templateUrl: './proposals.component.html',
    styleUrls: ['./proposals.component.scss']
})
export class ProposalsComponent implements AfterViewInit {

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    proposals: any;

    limit: number;

    skip: number;

    sortColumn: string;

    sortDirection: string;

    propCount: number;

    years: any;

    year: number;

    selectedYear: number;

    resultsLength = 0;

    displayedColumns = ['projectTitle', 'organization', 'createdOn', 'sponsor', 'amountRequested', 'totalProjectCost', 'link'];

    data: [];

    loaded: boolean;

    pageEvent: PageEvent;

    filterInputString: string;

    constructor(
        public proposalService: ProposalService,
        public submissionYearsService: SubmissionYearsService,
        private _router: Router
    ) {

        this.loaded = false;
        this.filterInputString = '';
        this.limit = 10;
        this.skip = 0;
        this.sortDirection = 'desc';
        this.sortColumn = 'createdOn';
        this.year = (new Date()).getFullYear();
    }

    getProposalCount(year: number, countFilter?: string): void {
        this.proposalService.getProposalCount(year, countFilter)
            .subscribe(
                (count) => { this.propCount = count; },
                (err) => {
                    console.log('getProposalCount - err', err);
                });
    }

    getSubmissionYears(): void {

        this.submissionYearsService.getAllSubmissionYears(this.year)
            .subscribe(
                (years) => {
                    console.log('years**', years);
                    this.years = years;
                    this.selectedYear = years[0]._id; //grab the first one, which should be most recent year
                    this.year = years[0].year; // Update the year to match the selected year
                    console.log('selectedYear', this.selectedYear);
                    console.log('year', this.year);

                    // Load initial data after years are loaded
                    this.getProposalCount(this.year);
                },
                (err) => {
                    console.log('getAllSubmissionYears - err', err);
                });
    }

    ngAfterViewInit(): void {

        this.sort.start = 'desc';

        // Don't call getProposalCount here, it will be called after years are loaded
        this.getSubmissionYears();

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => {
            console.log('this.sort', this.sort);
            console.log('this.sort.active', this.sort.active);
            console.log('this.sort.direction', this.sort.direction);
            this.skip = 0; //reset;
            this.sortDirection = this.sort.direction;
            this.sortColumn = this.sort.active;
            this.paginator.pageIndex = 0;
        });

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    return this.proposalService.getProps(this.year, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
                        .pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {

                    // Flip flag to show that loading has finished.
                    this.loaded = true;
                    // this.isRateLimitReached = data === null;

                    if (data === null) {
                        return [];
                    }

                    console.log('data', data);

                    // Only refresh the result length if there is new data. In case of rate
                    // limit errors, we do not want to reset the paginator to zero, as that
                    // would prevent users from re-triggering requests.
                    // this.orgCount = data.length;
                    this.getProposalCount(this.year, this.filterInputString);
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));

        // server-side filter
        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    console.log(event);
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    // Reset pagination when filtering
                    this.skip = 0;
                    this.paginator.pageIndex = 0;
                    this.proposalService.getProps(this.year, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
                        .subscribe((data) => {
                            this.data = data;
                            this.loaded = true;
                        });
                    this.getProposalCount(this.year, this.filterInputString);
                })
            )
            .subscribe();

    }

    //possible view Proposal
    goToProposal(propID: string): void {
        this._router.navigate(['/pages/proposal/', propID]);
    }

    // Method to clear filter
    clearFilter(): void {
        this.filterInputString = '';
        this.skip = 0;
        this.paginator.pageIndex = 0;
        if (this.input && this.input.nativeElement) {
            this.input.nativeElement.value = '';
        }
        this.proposalService.getProps(this.year, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
            .subscribe((data) => {
                this.data = data;
                this.loaded = true;
            });
        this.getProposalCount(this.year, this.filterInputString);
    }

    handlePageEvent(e: PageEvent): void {
        this.pageEvent = e;
        console.log('this.pageEvent', this.pageEvent);

        if (this.pageEvent.pageSize !== this.limit) {
            console.log('page size is different');
            this.limit = this.pageEvent.pageSize;
            this.skip = 0;
            this.paginator.pageIndex = 0;
        }
        else {
            if (this.pageEvent.previousPageIndex < this.pageEvent.pageIndex) {
                this.skip = this.skip + this.limit;
            }
            else {
                this.skip = this.skip - this.limit;
            }
        }

    }

    yearChanged(e: any): void {
        console.log('year changed', e);
        console.log('year id', e.value);
        console.log('this.years', this.years);
        console.log('year is ', this.years.find(y => y._id === e.value).year);
        this.selectedYear = this.years.find(y => y._id === e.value)._id;

        this.year = this.years.find(y => y._id === e.value).year;

        // Clear filter and reset pagination when year changes
        this.clearFilter();

        //fetch count and proposals again
        this.getProposalCount(this.year);
        this.proposalService.getProps(this.year, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
            .subscribe((data) => {
                this.data = data;
                this.loaded = true;
            },
                (err) => {
                    console.log('getProps - err', err);
                });

    }

}
