import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf, fromEvent } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';

import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
@Component({
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements AfterViewInit {

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filterInput', { static: true }) input: ElementRef;

    organizations: any;

    limit: number;

    skip: number;

    sortColumn: string;

    sortDirection: string;

    orgCount: number;

    resultsLength = 0;

    displayedColumns = ['name', 'createdOn', 'users', 'proposals', 'link'];

    data: [];

    loaded: boolean;

    pageEvent: PageEvent;

    filterInputString: string;

    constructor(public getOrgService: GetOrganizationService, private _router: Router) {
        this.loaded = false;
        this.filterInputString = '';
        this.limit = 10;
        this.skip = 0;
        this.sortDirection = 'desc';
        this.sortColumn = 'createdOn';

    }

    getOrganizationCount(countFilter?: string): void {
        this.getOrgService.getOrganizationCount(countFilter)
            .subscribe(
                (count) => { this.orgCount = count; });
    }

    ngAfterViewInit(): void {

        // console.log('this.sort', this.sort);
        this.sort.start = 'desc';

        this.getOrganizationCount(); // no need for parameter

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => {
            this.sortDirection = this.sort.direction;
            this.sortColumn = this.sort.active;
            this.paginator.pageIndex = 0;
        });

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    return this.getOrgService.getOrgs(this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection)
                        .pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {

                    // Flip flag to show that loading has finished.
                    this.loaded = true;
                    // this.isRateLimitReached = data === null;
                    if (data === null) {
                        return [];
                    }

                    // Only refresh the result length if there is new data. In case of rate
                    // limit errors, we do not want to reset the paginator to zero, as that
                    // would prevent users from re-triggering requests.
                    // this.orgCount = data.length;
                    this.getOrganizationCount(this.filterInputString);
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
                    this.getOrgService.getOrgs(this.skip, this.limit, this.filterInputString, this.sortColumn, this.sortDirection).subscribe((data) => { this.data = data; });
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
        console.log('this.pageEvent', this.pageEvent);

        if (this.pageEvent.pageSize !== this.limit) {
            console.log('page size is different');
            this.limit = this.pageEvent.pageSize;
            this.skip = 0;
            console.log('this.limit', this.limit);
            console.log('this.skip', this.skip);
            // this.paginator.firstPage();
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

}
