import {
    Component,
    ViewChild,
    OnInit,
    OnChanges,
    SimpleChanges,
    Input,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { InOrgService } from 'app/core/services/user/in-org.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';
import { PopulatedUserOrganizationRow } from 'app/core/utilities/organization-access.util';
import { SelectedOrganizationComponent } from './selected-organization/selected-organization.component';

@Component({
    standalone: false,
    selector: 'app-user-organization',
    templateUrl: './user-organization.component.html',
    styleUrls: ['./user-organization.component.scss'],
})
export class UserOrganizationComponent implements OnInit, OnChanges {
    @Input()
    user: any;

    @Input()
    organizations: PopulatedUserOrganizationRow[] = [];

    @Input()
    organizationsLoading = false;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;

    displayedColumns = ['name', 'createdOn', 'link'];

    dataSource = new MatTableDataSource<PopulatedUserOrganizationRow>([]);

    inOrganization = false;

    email: string;

    inOrgCheck: boolean;

    loaded = false;

    readonly tablePageSizeOptions = [5, 10, 25];
    tablePageSize: number;

    constructor(
        private router: Router,
        public dialog: MatDialog,
        private inOrg: InOrgService,
        private _userPreferences: UserPreferencesService,
    ) {
        this.tablePageSize = this._userPreferences.pageSizeForOptions(this.tablePageSizeOptions);
    }

    ngOnInit(): void {
        this.inOrg.currentInOrg.subscribe((message) => {
            this.inOrgCheck = message;
        });

        if (!this.user) {
            this.router.navigate(['/pages/auth/logout']);
            return;
        }

        this.email = this.user.email;
        this.syncFromParent();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['organizations'] || changes['organizationsLoading']) {
            this.syncFromParent();
        }
    }

    applyFilter(filterValue: string): void {
        let filteredValue = filterValue.trim();
        filteredValue = filteredValue.toLowerCase();
        this.dataSource.filter = filteredValue;
    }

    createOrganization(): void {
        this.router.navigate(['/pages/organization/create']);
    }

    openSelectedOrgDialog(org): void {
        this.dialog.open(SelectedOrganizationComponent, {
            width: '400px',
            data: { name: org.name, orgID: org.organizationID },
        });
    }

    onRowClicked(row): void {
        this.openSelectedOrgDialog(row);
    }

    goToOrganization(orgID: string): void {
        this.router.navigate(['/pages/organization/', orgID]);
    }

    onOrganizationsPage(event: { pageSize: number }): void {
        if (event.pageSize !== this.tablePageSize) {
            this.tablePageSize = event.pageSize;
        }
    }

    private syncFromParent(): void {
        if (this.organizationsLoading) {
            this.loaded = false;
            return;
        }

        const rows = this.organizations ?? [];
        this.inOrganization = rows.length > 0;
        this.dataSource.data = rows;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        if (this.paginator) {
            this.paginator.pageSize = this.tablePageSize;
        }
        this.inOrg.changeMessage(this.inOrganization);
        this.loaded = true;
    }
}
