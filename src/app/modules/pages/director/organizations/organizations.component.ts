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
    }

    getOrganizationCount(countFilter?: string): void {
        this.getOrgService.getOrganizationCount(countFilter)
            .subscribe(
                (count) => { this.orgCount = count; });
    }

    ngAfterViewInit(): void {

        this.getOrganizationCount(); // no need for parameter

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    // this.getOrganizationCount(this.filterInputString);
                    return this.getOrgService.getOrgs(this.skip, this.limit, this.filterInputString).pipe(catchError(() => observableOf(null)));
                }),
                map((data) => {

                    // Flip flag to show that loading has finished.
                    this.loaded = true;
                    // this.isRateLimitReached = data === null;

                    console.log('data', data);

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
                    this.getOrgService.getOrgs(this.skip, this.limit, this.filterInputString).subscribe((data) => { this.data = data; });
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
