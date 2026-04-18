import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { OrganizationData } from 'app/common/interfaces/OrganizationData';
import { GetUserService } from 'app/core/services/user/get-user.service';

@Component({
    standalone: false,
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss'],
})
export class OrganizationsComponent implements OnInit {
    /**
     * Paginator/sort live inside *ngIf — classic @ViewChild runs before they exist.
     * Setters run when Material components mount so length shows (not "0 of 0").
     */
    private _paginator: MatPaginator;
    private _sort: MatSort;

    @ViewChild(MatPaginator)
    set matPaginator(p: MatPaginator | undefined) {
        this._paginator = p;
        this._attachPaginatorAndSort();
    }

    @ViewChild(MatSort)
    set matSort(s: MatSort | undefined) {
        this._sort = s;
        this._attachPaginatorAndSort();
    }

    // TODO: refactor to typed model
    user: any;

    displayedColumns = ['name', 'createdOn', 'action'];
    dataSource: MatTableDataSource<OrganizationData>;
    hasOrganizations: boolean = false;
    loaded: boolean = false;

    constructor(
        private _router: Router,
        public getUserService: GetUserService,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.getUser();

        if (!this.user) {
            this._router.navigate(['/sign-out']);
            return;
        }

        this.checkOrganizations();
    }

    /** Wire paginator/sort when both dataSource and Material refs exist */
    private _attachPaginatorAndSort(): void {
        if (!this.dataSource) {
            return;
        }
        if (this._paginator) {
            this.dataSource.paginator = this._paginator;
        }
        if (this._sort) {
            this.dataSource.sort = this._sort;
        }
    }

    createOrganization(): void {
        this._router.navigate(['/pages/organization/create']);
    }

    goToOrganization(orgID: string): void {
        this._router.navigate(['/pages/organization/', orgID]);
    }

    private getUser(): void {
        this.user = JSON.parse(localStorage.getItem('currentUser'));
    }

    private checkOrganizations(): void {
        this.getUserService.getUserbyID(this.user._id).subscribe({
            next: (user) => {
                const organizations = user.organizations;

                if (organizations && organizations.length > 0) {
                    this.hasOrganizations = true;
                    this.dataSource = new MatTableDataSource(organizations);
                } else {
                    this.hasOrganizations = false;
                }

                this.loaded = true;
                this._attachPaginatorAndSort();
                this._cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load organizations', err);
                this.hasOrganizations = false;
                this.loaded = true;
                this._cdr.detectChanges();
            }
        });
    }
}
