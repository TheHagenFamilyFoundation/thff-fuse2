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
    selector: 'app-org-proposals',
    templateUrl: './org-proposals.component.html',
    styleUrls: ['./org-proposals.component.scss'],
})
export class OrgProposalsComponent implements OnInit {
    @Input()
    org: any;

    // @Input()
    // proposals: any;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    @ViewChild(MatSort, { static: false }) sort: MatSort;



    displayedColumns = ['projectTitle', 'createdOn', 'link'];

    // email: string;

    loaded: boolean;

    dataSource: MatTableDataSource<ProposalData>;

    constructor(
        public getUserService: GetUserService,
        private _router: Router
    ) { }

    ngOnInit(): void {
        console.log('org-proposals');
        // this.email = this.user.email;

        if (!localStorage.getItem('currentUser')) {
            console.log('user-org - kick out user');
            this._router.navigate(['/pages/auth/logout']);
        }

        // this.dataSource = new MatTableDataSource([]);

        // console.log('user-organization - check organizations 2');
        this.checkProposals();
    }

    checkProposals(): void {
        console.log('proposals**', this.org.proposals);
        console.log('this.org._id', this.org._id);

        // return the proposals

        this.dataSource = new MatTableDataSource(this.org.proposals);

        console.log(
            'debug - org-proposals - proposals list ',
            this.dataSource
        );

        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    createProposal(): void {
        console.log('create proposal');
        this._router.navigate(['/pages/proposal/create'], { queryParams: { org: this.org._id } });
    }
    goToProposal(proposalID: string): void {
        console.log('proposalID', proposalID);
        this._router.navigate(['/pages/proposal/', proposalID]);
    }
}


export interface ProposalData {
    name: string;
    color: string;
}
