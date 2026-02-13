import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
//services
import { Doc501c3StatusService } from 'app/core/services/organization/501c3/doc501c3-status.service';
import { Delete501c3Service } from 'app/core/services/organization/501c3/delete-501c3.service';
import { Get501c3Service } from 'app/core/services/organization/501c3/get-501c3.service';
import { Upload501c3Service } from 'app/core/services/organization/501c3/upload-501c3.service';
import { Create501c3Service } from 'app/core/services/organization/501c3/create-501c3.service';

import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { Upload501c3DialogComponent } from './upload-501c3-dialog/upload-501c3-dialog.component';

@Component({
    selector: 'app-org-doc501c3',
    templateUrl: './org-doc501c3.component.html',
    styleUrls: ['./org-doc501c3.component.scss'],
})
export class OrgDoc501c3Component implements OnInit {
    @Input()
    org: any;
    orgID: any; //string - created
    organizationID: any; // mongo id
    outputStatus: any;
    hasUpload501c3: boolean = false;
    rejected501c3: boolean = false;
    doc501c3: any;
    status: any;
    constructor(
        public _router: Router,
        private dialog: MatDialog,
        public upload501c3Service: Upload501c3Service,
        public getOrganizationService: GetOrganizationService,
        public doc501c3StatusService: Doc501c3StatusService,
        public delete501c3Service: Delete501c3Service,
        public get501c3Service: Get501c3Service,
        public create501c3Service: Create501c3Service
    ) { }

    ngOnInit(): void {
        console.log('org-doc501c3 org-', this.org);

        this.orgID = this.org.organizationID;
        this.organizationID = this.org.id;

        if (this.org.doc501c3) {
            console.log('has 501c3', this.org.doc501c3);
            this.hasUpload501c3 = true;

            this.doc501c3 = this.org.doc501c3;

            this.status = this.doc501c3.status;

            // set status
            this.setStatus(this.status);
        } else {
            this.hasUpload501c3 = false;
        }
    }

    setStatus(s: number): void {
        console.log('setStatus', s);

        this.outputStatus = this.configureStatus(s);

        console.log('outputStatus', this.outputStatus);

        if (s === 3) {
            this.rejected501c3 = true;
        } else {
            this.rejected501c3 = false;
        }
    }

    // takes in a status s that is a number
    configureStatus(s: number): string {
        console.log('configureStatus', s);

        return this.doc501c3StatusService.getStatus(s);
    }

    get501c3(): void {
        this.get501c3Service.view501c3(this.doc501c3._id).subscribe((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        });
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(Upload501c3DialogComponent, {
            width: '480px',
            disableClose: true,
            data: { orgID: this.orgID }
        });

        dialogRef.afterClosed().subscribe((uploaded) => {
            if (uploaded) {
                this.getOrganization(this.orgID);
            }
        });
    }

    getOrganization(orgID): void {
        this.getOrganizationService.getOrgbyID(orgID).subscribe({
            next: (org) => {
                this.org = org;
                this.organizationID = this.org.id;

                if (this.org.doc501c3) {
                    this.hasUpload501c3 = true;
                    this.doc501c3 = this.org.doc501c3;
                    this.status = this.doc501c3.status;
                    this.setStatus(this.status);
                } else {
                    this.hasUpload501c3 = false;
                }
            },
            error: (err) => {
                console.error('getOrgByID error:', err);
            }
        });
    }
}
