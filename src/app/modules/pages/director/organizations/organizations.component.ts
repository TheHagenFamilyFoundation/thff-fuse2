import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Observable, of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
@Component({
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements AfterViewInit {

    // @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

    // @ViewChild(MatSort, { static: false }) sort: MatSort;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    organizations: any;

    limit: number;

    skip: number;

    orgCount: number;

    resultsLength = 0;

    displayedColumns = ['name', 'createdOn', 'users', 'proposals', 'link'];

    data: [];

    loaded: boolean;

    pageEvent: PageEvent;

    constructor(public getOrgService: GetOrganizationService, private _router: Router) {
        this.loaded = false;

        this.limit = 10;
        this.skip = 0;
    }

    // ngOnInit(): void {
    //     this.getOrganizationCount();
    //     this.getOrganizations();
    // }

    getOrganizationCount(): void {
        this.getOrgService.getOrganizationCount()
            .subscribe(
                (count) => { this.orgCount = count; });
    }

    ngAfterViewInit(): void {

        this.getOrganizationCount();

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.loaded = false;
                    return this.getOrgService.getOrgs(this.skip, this.limit).pipe(catchError(() => observableOf(null)));
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
                    this.getOrganizationCount();
                    return data;
                }),
            )
            .subscribe(data => (this.data = data));
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
