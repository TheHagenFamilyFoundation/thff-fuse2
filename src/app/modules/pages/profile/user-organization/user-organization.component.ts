import {
    Component,
    ViewChild,
    OnInit,
    Input,
    AfterViewInit,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { GetUserService } from 'app/core/services/user/get-user.service';
import { InOrgService } from 'app/core/services/user/in-org.service';

// import { CreateOrganizationComponent } from '../../organization/create-organization/create-organization.component';
import { SelectedOrganizationComponent } from './selected-organization/selected-organization.component';

import { OrganizationData } from 'app/common/interfaces/OrganizationData';
@Component({
    selector: 'app-user-organization',
    templateUrl: './user-organization.component.html',
    styleUrls: ['./user-organization.component.scss'],
})
export class UserOrganizationComponent implements OnInit {
    @Input()
    user: any;

    @Input()
    organizations: any;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;

    // displayedColumns = ['id', 'name', 'progress', 'color'];
    displayedColumns = ['name', 'createdOn', 'link'];

    dataSource: MatTableDataSource<OrganizationData>;

    inOrganization = false;

    orgName: any;

    email: string;

    // string
    description: any;

    inOrgCheck: boolean;

    loaded: boolean;

    constructor(
        public getUserService: GetUserService,
        private router: Router,
        public dialog: MatDialog,
        private inOrg: InOrgService
    ) {
        this.loaded = false;

        // // Create 100 organizations
        // const organizations: OrganizationData[] = [];
        // for (let i = 1; i <= 100; i++) { organizations.push(createNewOrganization(i)); }

        // // Assign the data to the data source for the table to render
        // this.dataSource = new MatTableDataSource(organizations);
    }

    ngOnInit(): void {
        this.inOrg.currentInOrg.subscribe((message) => {
            this.inOrgCheck = message;
        });

        console.log('user-organization - setting', this.user);
        this.email = this.user.email;

        if (!this.user) {
            console.log('user-org - kick out user');
            this.router.navigate(['/pages/auth/logout']);
        }

        this.dataSource = new MatTableDataSource([]);

        // console.log('user-organization - check organizations 2');
        this.checkOrganizations();
    }

    /**
     * Set the paginator and sort after the view init since this component will
     * be able to query its view for the initialized paginator and sort.
     */
    // ngAfterViewInit() {

    //   this.dataSource.paginator = this.paginator;
    //   this.dataSource.sort = this.sort;
    // }

    applyFilter(filterValue: string): void {
        let filteredValue = filterValue.trim(); // Remove whitespace
        filteredValue = filteredValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filteredValue;
    }

    getUser(): void {
        console.log('user LOI - getUser');

        console.log(
            'user LOI - currentUser',
            JSON.parse(localStorage.getItem('currentUser')).user
        );

        this.getUserService.getUserbyID(this.user._id).subscribe(() => {
            // pass in the user to the check functions
            this.checkOrganizations();
        });
    }

    // checks if user is in any organizations
    checkOrganizations(): void {
        console.log('user-organization - check organizations', this.user._id);

        // will return the organizations
        this.getUserService.getUserbyID(this.user._id).subscribe((user) => {
            console.log('user-organization - checkOrganizations - user', user);

            const organization = user[0]?.organizations;

            if (organization && organization.length > 0) {
                this.inOrganization = true;

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

                this.inOrg.changeMessage(true);

                this.loaded = true;
            } else {
                // no organizations
                console.log('not in any organizations');

                this.inOrganization = false;

                this.loaded = true;
            }
        });
    } // end of checkOrganization

    createOrganization(): void {
        console.log('create organization');
        this.router.navigate(['/pages/organization/create']);
    }

    // this might be kept
    openSelectedOrgDialog(org): void {
        console.log('org.organizationID', org.organizationID);

        const dialogRef = this.dialog.open(SelectedOrganizationComponent, {
            width: '400px',
            data: { name: org.name, orgID: org.organizationID },
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log('The dialog was closed'); // debug
            console.log('result', result); // debug
        });
    }

    onRowClicked(row): void {
        console.log('Row clicked: ', row);

        this.openSelectedOrgDialog(row); // pass in the org from row object
    }

    newMessage(): void {
        this.inOrg.changeMessage(false);
    }

    goToOrganization(orgID: string): void {
        this.router.navigate(['/pages/organization/', orgID]);
    }
} // end of component
