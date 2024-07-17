import { Component, ViewChild, Input, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { merge, Observable, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';

import { GetUserService } from 'app/core/services/user/get-user.service';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

@Component({
    selector: 'app-org-proposals',
    templateUrl: './org-proposals.component.html',
    styleUrls: ['./org-proposals.component.scss'],
})
export class OrgProposalsComponent implements AfterViewInit {
    @Input()
    org: any;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    displayedColumns = ['projectTitle', 'createdOn', 'link'];

    limit: number;

    skip: number;

    sortColumn: string;

    sortDirection: string;

    propCount: number;

    years: any;

    year: number;

    selectedYear: number;

    currentYear: any;

    portalOpen: boolean;

    loaded: boolean;

    data: [];

    dataSource: MatTableDataSource<ProposalData>;

    filterInputString: string;

    pageEvent: PageEvent;

    portalMessage: string;

    constructor(
        public getUserService: GetUserService,
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

    ngAfterViewInit(): void {

        this.sort.start = 'desc';

        //TODO: use the store
        if (!localStorage.getItem('currentUser')) {
            console.log('user-org - kick out user');
            this._router.navigate(['/pages/auth/logout']);
        }
        console.log('this.year', this.year);
        this.getOrgProposalCount(this.year, this.org._id); // no need for parameter
        this.getSubmissionYears();
        this.getCurrentSubmissionYear();

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
                    return this.proposalService.getOrgProps(this.year, this.org._id, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
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
                    this.getOrgProposalCount(this.year, this.filterInputString);
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));

        // server-side filter
        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                filter(Boolean),
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    console.log(event);
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    this.proposalService.getOrgProps(this.year, this.org._id, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
                        .subscribe((data) => { this.data = data; });
                    this.getOrgProposalCount(this.year, this.filterInputString);
                })
            )
            .subscribe();

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

    getSubmissionYears(): void {

        this.submissionYearsService.getAllSubmissionYears(this.year)
            .subscribe(
                (years) => {
                    console.log('years**', years);
                    this.years = years;
                    this.selectedYear = years[0]._id; //grab the first one, which should be most recent year
                    console.log('selectedYear', this.selectedYear);
                },
                (err) => {
                    console.log('getAllSubmissionYears - err', err);
                });
    }

    getCurrentSubmissionYear(): void {

        this.submissionYearsService.getCurrentSubmissionYear()
            .subscribe(
                (year) => {
                    this.currentYear = year;
                    console.log('getCurrentSubmissionyear - currentYear', this.currentYear);
                    this.portalOpen = this.currentYear.active;

                    this.portalMessage = `${this.currentYear.year} Grant Cycle is Closed`;
                },
                (err) => {
                    console.log('getCurrentSubmissionyear - err', err);

                    this.portalMessage = `${this.year} Grant Cycle Is Opening Soon`;
                });

    }

    // check if org has proposals, phase this out
    //TODO: phase out
    checkProposals(): void {
        console.log('proposals**', this.org.proposals);
        console.log('this.org._id', this.org._id);

        this.sort.start = 'desc';

        //filter out current year proposals
        const proposals = this.filterByYear(this.org.proposals, this.year);

        this.data = proposals;

    }

    createProposal(): void {
        console.log('create proposal');
        this._router.navigate(['/pages/proposal/create'], { queryParams: { org: this.org._id } });
    }
    goToProposal(proposalID: string): void {
        console.log('proposalID', proposalID);
        this._router.navigate(['/pages/proposal/', proposalID]);
    }

    getOrgProposalCount(year: number, countFilter?: string): void {
        this.proposalService.getOrgProposalCount(year, this.org._id, countFilter)
            .subscribe(
                (count) => { this.propCount = count; },
                (err) => {
                    console.log('getOrgProposalCount - err', err);
                });

    }

    yearChanged(e: any): void {
        console.log('year changed', e);
        console.log('year id', e.value);
        console.log('this.years', this.years);
        console.log('year is ', this.years.find(y => y._id === e.value).year);
        this.selectedYear = this.years.find(y => y._id === e.value)._id;

        this.year = this.years.find(y => y._id === e.value).year;

        //fetch count and proposals again
        this.getOrgProposalCount(this.year, this.filterInputString);
        this.proposalService.getOrgProps(this.year, this.org._id, this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
            .subscribe((data) => {
                this.data = data;
            },
                (err) => {
                    console.log('getOrgProps - err', err);
                });

    }

    // Function to filter items by year
    filterByYear(items, year): any {
        const startDate = new Date(year, 0, 1); // January 1 of the given year
        const endDate = new Date(year + 1, 0, 1); // January 1 of the next year

        return items.filter((item: any) => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= startDate && itemDate < endDate;
        });
    }

}

export interface ProposalData {
    name: string;
    color: string;
}
