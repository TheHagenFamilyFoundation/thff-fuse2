import { Component, OnInit, ViewChild } from '@angular/core';
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
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: false }) sort: MatSort;

    // TODO: refactor to typed model
    user: any;

    displayedColumns = ['name', 'createdOn', 'action'];
    dataSource: MatTableDataSource<OrganizationData>;
    hasOrganizations: boolean = false;
    loaded: boolean = false;

    constructor(
        private _router: Router,
        public getUserService: GetUserService
    ) {}

    ngOnInit(): void {
        this.getUser();

        if (!this.user) {
            this._router.navigate(['/sign-out']);
            return;
        }

        this.checkOrganizations();
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
                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort;
                } else {
                    this.hasOrganizations = false;
                }

                this.loaded = true;
            },
            error: (err) => {
                console.error('Failed to load organizations', err);
                this.hasOrganizations = false;
                this.loaded = true;
            }
        });
    }
}
