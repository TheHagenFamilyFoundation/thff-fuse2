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

@Component({
    selector: 'app-user-proposals',
    templateUrl: './user-proposals.component.html',
    styleUrls: ['./user-proposals.component.scss'],
})
export class UserProposalsComponent implements OnInit {
    @Input()
    user: any;

    @Input()
    proposals: any;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;

    displayedColumns = ['name', 'createdOn', 'link'];

    email: string;

    dataSource: MatTableDataSource<ProposalData>;

    constructor(
        public getUserService: GetUserService,
        private router: Router
    ) {}

    ngOnInit(): void {
        console.log('user-organization - setting', this.user);
        this.email = this.user.email;

        if (!this.user) {
            console.log('user-org - kick out user');
            this.router.navigate(['/pages/auth/logout']);
        }

        this.dataSource = new MatTableDataSource([]);

        // console.log('user-organization - check organizations 2');
        this.checkProposals();
    }

    checkProposals(): void {}

    createProposal(): void {
        console.log('create proposal');
        this.router.navigate(['/pages/proposal/create']);
    }
}

export interface ProposalData {
    name: string;
    color: string;
}
