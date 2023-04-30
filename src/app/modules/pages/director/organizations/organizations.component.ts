import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
@Component({
    selector: 'app-organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements OnInit {

    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;

    organizations: any;

    limit: number;

    skip: number;

    displayedColumns = ['name', 'createdOn', 'users', 'proposals'];

    dataSource: MatTableDataSource<any>;

    loaded: boolean;

    constructor(public getOrgService: GetOrganizationService) {
        this.loaded = false;

        this.limit = 10;
        this.skip = 10;
    }

    ngOnInit(): void {
        this.getOrganizations();
    }

    getOrganizations(): void {
        this.getOrgService.getOrgs(this.skip, this.limit)
            .subscribe(
                (orgs) => {
                    console.log('orgs', orgs);

                    this.organizations = orgs;
                    this.organizations.forEach((org) => {
                        console.log('org.users', org.users.length);
                        console.log('org.proposals', org.proposals.length);
                    });

                    this.dataSource = new MatTableDataSource(this.organizations);

                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort;

                    this.loaded = true;
                },
            );
    }

}
