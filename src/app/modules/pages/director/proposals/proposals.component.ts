import { Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
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

    displayedColumns = ['projectTitle', 'organization', 'createdOn', 'sponsor', 'amountRequested', 'totalProjectCost', 'action'];
    data: [];
    propCount: number;
    years: any;
    selectedYear: number;
    loaded: boolean = false;
    pageEvent: PageEvent;
    filterInputString: string = '';

    private limit: number = 10;
    private skip: number = 0;
    private sortColumn: string = 'createdOn';
    private sortDirection: string = 'desc';
    private year: number = (new Date()).getFullYear();

    constructor(
        public proposalService: ProposalService,
        public submissionYearsService: SubmissionYearsService,
        private _router: Router
    ) {}

    ngAfterViewInit(): void {
        this.sort.start = 'desc';
        this.getSubmissionYears();

        this.sort.sortChange.subscribe(() => {
            this.skip = 0;
            this.sortDirection = this.sort.direction;
            this.sortColumn = this.sort.active;
            this.paginator.pageIndex = 0;
        });

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    return this.proposalService.getProps(
                        this.year, this.skip, this.limit, this.filterInputString,
                        this.sortColumn, this.sortDirection
                    ).pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {
                    this.loaded = true;
                    if (data === null) { return []; }
                    this.getProposalCount(this.year, this.filterInputString);
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));

        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    this.skip = 0;
                    this.paginator.pageIndex = 0;
                    this.proposalService.getProps(
                        this.year, this.skip, this.limit, this.filterInputString,
                        this.sortColumn, this.sortDirection
                    ).subscribe((data) => {
                        this.data = data;
                        this.loaded = true;
                    });
                    this.getProposalCount(this.year, this.filterInputString);
                })
            )
            .subscribe();
    }

    goToProposal(propID: string): void {
        this._router.navigate(['/pages/proposal/', propID]);
    }

    clearFilter(): void {
        this.filterInputString = '';
        this.skip = 0;
        this.paginator.pageIndex = 0;
        if (this.input?.nativeElement) {
            this.input.nativeElement.value = '';
        }
        this.proposalService.getProps(
            this.year, this.skip, this.limit, this.filterInputString,
            this.sortColumn, this.sortDirection
        ).subscribe((data) => {
            this.data = data;
            this.loaded = true;
        });
        this.getProposalCount(this.year, this.filterInputString);
    }

    handlePageEvent(e: PageEvent): void {
        this.pageEvent = e;
        if (this.pageEvent.pageSize !== this.limit) {
            this.limit = this.pageEvent.pageSize;
            this.skip = 0;
            this.paginator.pageIndex = 0;
        } else {
            if (this.pageEvent.previousPageIndex < this.pageEvent.pageIndex) {
                this.skip = this.skip + this.limit;
            } else {
                this.skip = this.skip - this.limit;
            }
        }
    }

    yearChanged(e: any): void {
        const selected = this.years.find(y => y._id === e.value);
        this.selectedYear = selected._id;
        this.year = selected.year;
        this.clearFilter();
        this.getProposalCount(this.year);
        this.proposalService.getProps(
            this.year, this.skip, this.limit, this.filterInputString,
            this.sortColumn, this.sortDirection
        ).subscribe({
            next: (data) => { this.data = data; this.loaded = true; },
            error: (err) => { console.error('getProps error', err); }
        });
    }

    private getSubmissionYears(): void {
        this.submissionYearsService.getAllSubmissionYears(this.year).subscribe({
            next: (years) => {
                this.years = years;
                this.selectedYear = years[0]._id;
                this.year = years[0].year;
                this.getProposalCount(this.year);
            },
            error: (err) => { console.error('getAllSubmissionYears error', err); }
        });
    }

    private getProposalCount(year: number, countFilter?: string): void {
        this.proposalService.getProposalCount(year, countFilter).subscribe({
            next: (count) => { this.propCount = count; },
            error: (err) => { console.error('getProposalCount error', err); }
        });
    }
}
