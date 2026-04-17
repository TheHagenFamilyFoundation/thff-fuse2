import { Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

@Component({
    standalone: false,
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements AfterViewInit {

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    displayedColumns = ['name', 'createdOn', 'users', 'proposals', 'action'];
    data: [];
    orgCount: number;
    years: any;
    selectedYear: number;
    loaded: boolean = false;
    pageEvent: PageEvent;
    hasProposals: boolean = true;

    private limit: number = 10;
    private skip: number = 0;
    private sortColumn: string = 'createdOn';
    private sortDirection: string = 'desc';
    private filterInputString: string = '';
    year: number = (new Date()).getFullYear();

    constructor(
        public getOrgService: GetOrganizationService,
        public submissionYearService: SubmissionYearsService,
        private _router: Router
    ) {}

    get effectiveYear(): number | undefined {
        return this.hasProposals ? this.year : undefined;
    }

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
                    return this.getOrgService.getOrgs(
                        this.skip, this.limit, this.filterInputString,
                        this.sortColumn, this.sortDirection, this.effectiveYear
                    ).pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {
                    this.loaded = true;
                    if (data === null) { return []; }
                    this.getOrganizationCount(this.filterInputString);
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));

        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                filter(Boolean),
                debounceTime(500),
                distinctUntilChanged(),
                tap((event: KeyboardEvent) => {
                    this.filterInputString = (event.target as HTMLInputElement).value;
                    this.getOrgService.getOrgs(
                        this.skip, this.limit, this.filterInputString,
                        this.sortColumn, this.sortDirection, this.effectiveYear
                    ).subscribe((data) => { this.data = data; });
                    this.getOrganizationCount(this.filterInputString);
                })
            )
            .subscribe();
    }

    goToOrganization(orgID: string): void {
        this._router.navigate(['/pages/organization/', orgID]);
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
        this.refreshData();
    }

    hasProposalsChanged(): void {
        this.refreshData();
    }

    private refreshData(): void {
        this.skip = 0;
        this.paginator.pageIndex = 0;
        this.getOrganizationCount(this.filterInputString);
        this.getOrgService.getOrgs(
            this.skip, this.limit, this.filterInputString,
            this.sortColumn, this.sortDirection, this.effectiveYear
        ).subscribe({
            next: (data) => { this.data = data; this.loaded = true; },
            error: (err) => { console.error('getOrgs error', err); }
        });
    }

    private getSubmissionYears(): void {
        this.submissionYearService.getAllSubmissionYears(this.year).subscribe({
            next: (years) => {
                this.years = years;
                this.selectedYear = years[0]._id;
                this.year = years[0].year;
                this.getOrganizationCount();
            },
            error: (err) => { console.error('getAllSubmissionYears error', err); }
        });
    }

    private getOrganizationCount(countFilter?: string): void {
        this.getOrgService.getOrganizationCount(countFilter, this.effectiveYear).subscribe({
            next: (count) => { this.orgCount = count; },
            error: (err) => { console.error('getOrganizationCount error', err); }
        });
    }
}
