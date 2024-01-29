import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { OrganizationData } from 'app/common/interfaces/OrganizationData';

import { GetUserService } from 'app/core/services/user/get-user.service';
@Component({
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss'],
})
export class OrganizationsComponent implements OnInit {
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;

    //TODO: refactor
    user: any;

    displayedColumns = ['name', 'createdOn', 'link'];

    dataSource: MatTableDataSource<OrganizationData>;

    // inOrganization: boolean = false;

    loaded: boolean = false;

    constructor(
        private _router: Router,
        public getUserService: GetUserService
    ) {
        this.loaded = false;
    }
    ngOnInit(): void {
        //fix
        this.getUser();

        if (!this.user) {
            console.log('user-org - kick out user');
            this._router.navigate(['/sign-out']);
        }

        this.checkOrganizations();
    }
    createOrganization(): void {
        console.log('create organization');
        this._router.navigate(['/pages/organization/create']);
    }

    //get user
    //set user object from localStorage
    getUser(): void {
        console.log('Organizations - user - getUser');

        console.log(
            'Organizations - user - currentUser',
            JSON.parse(localStorage.getItem('currentUser'))
        );

        this.user = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Organizations - this.user', this.user);
    }
    //get organizations with userId
    // checks if user is in any organizations
    checkOrganizations(): void {
        console.log('user-organizaiton - check organizations', this.user._id);

        // will return the organizations
        this.getUserService.getUserbyID(this.user._id).subscribe((user) => {
            console.log('user-organization - checkOrganizations - user', user);

            const organization = user.organizations;

            if (organization && organization.length > 0) {
                // this.inOrganization = true;

                console.log(
                    'user-organizations - organization list ',
                    organization
                );

                this.dataSource = new MatTableDataSource(organization);

                console.log(
                    'debug - user-organizations - organization list ',
                    this.dataSource
                );

                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;

                console.log(
                    'after dataSource paginator - user-organizations - organization list ',
                    this.dataSource
                );

                // this.inOrg.changeMessage(true);

                this.loaded = true;
            } else {
                // no organizations
                console.log('not in any organizations');

                // this.inOrganization = false;

                this.loaded = true;
            }
        });
    } // end of checkOrganization

    goToOrganization(orgID: string): void {
        this._router.navigate(['/pages/organization/', orgID]);
    }
}
