import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-selected-organization',
    templateUrl: './selected-organization.component.html',
    styleUrls: ['./selected-organization.component.scss'],
})
export class SelectedOrganizationComponent implements OnInit {
    orgLink = '/pages/organization/';

    link: string;

    orgID: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        // will log the entire data object
        console.log('this.data', this.data);

        this.orgID = this.data.orgID;

        this.link = this.orgLink + this.data.orgID;

        console.log('this is the link', this.link);
    }

    cancel(): void {
        console.log('cancel pressed');
    }
}
