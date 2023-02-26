import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
//services
import { Doc501c3StatusService } from 'app/core/services/organization/501c3/doc501c3-status.service';
import { Delete501c3Service } from 'app/core/services/organization/501c3/delete-501c3.service';
import { Get501c3Service } from 'app/core/services/organization/501c3/get-501c3.service';
import { Upload501c3Service } from 'app/core/services/organization/501c3/upload-501c3.service';
import { Create501c3Service } from 'app/core/services/organization/501c3/create-501c3.service';

import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';

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
    canUpload501c3: boolean = false;
    submitted: boolean = false;
    file: File;
    doc501c3: any;
    status: any;
    constructor(
        public _router: Router,
        public upload501c3Service: Upload501c3Service,
        public getOrganizationService: GetOrganizationService,
        public doc501c3StatusService: Doc501c3StatusService,
        public delete501c3Service: Delete501c3Service,
        public get501c3Service: Get501c3Service,
        public create501c3Service: Create501c3Service
    ) {}

    ngOnInit(): void {
        console.log('org-doc501c3 org-', this.org);

        this.orgID = this.org.organizationID;
        this.organizationID = this.org.id;

        if (this.org.doc501c3.length > 0) {
            console.log('has 501c3', this.org.doc501c3[0]);
            this.hasUpload501c3 = true;

            this.doc501c3 = this.org.doc501c3[0];

            this.status = this.doc501c3.status;

            // set status
            this.setStatus(this.status);
        } else {
            this.hasUpload501c3 = false;
            this.canUpload501c3 = false;
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
    fileChange(event): void {
        console.log('fileChange', event);

        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.file = fileList[0];

            this.canUpload501c3 = true;
        } else {
            this.canUpload501c3 = false;
        }
    }
    get501c3(): void {
        console.log('getting 501c3');

        this.get501c3Service.get501c3(this.orgID).subscribe((result) => {
            console.log('get501c3 - result', result);

            // route to the s3 image url
            const { url } = result;
            console.log('url', url);
            // this.router.navigate([result.url]);
            this._router.navigate(['/externalRedirect', { externalUrl: url }], {
                skipLocationChange: true,
            });
        });
    }

    upload(): void {
        console.log('upload replacement');

        // delete the old one
        console.log('deleting 501c3');

        this.submitted = true;

        // call the delete 501c3 service
        this.delete501c3Service.delete501c3byOrgID(this.orgID).subscribe(() => {
            this.upload501c3Service
                .upload501c3(this.file, this.orgID)
                .subscribe(
                    (result) => {
                        console.log('result', result);

                        if (result.body) {
                            console.log('result has body');

                            const body = {
                                url: result.body.files[0].extra.Location,
                                fileName: result.body.files[0].fd,
                                organization: this.organizationID,
                                orgID: this.orgID,
                            };

                            this.create501c3Service.create501c3(body).subscribe(
                                (result2) => {
                                    console.log('result2', result2);

                                    if (result2.body) {
                                        console.log('result has body');
                                    }
                                    // refresh the organization
                                    this.getOrganization(this.orgID);
                                    this.submitted = false;
                                },
                                (err) => {
                                    console.log(err);
                                    this.submitted = false;
                                }
                            );
                        }
                    },
                    (err) => {
                        console.log(err);
                        this.submitted = false;
                    }
                );
        });
    }
    delete501c3(): void {
        console.log('deleting 501c3');

        // call the delete 501c3 service
        this.delete501c3Service
            .delete501c3byOrgID(this.orgID)
            .subscribe((result) => {
                console.log('result', result);

                // refresh the organization
                this.getOrganization(this.orgID);

                this.outputStatus = '';

                this.status = null;
            });
    }

    getOrganization(orgID): void {
        console.log('check organizations');

        // query database for that organization

        this.getOrganizationService.getOrgbyID(orgID).subscribe((org) => {
            console.log('org', org);

            this.org = org[0];

            this.organizationID = this.org.id;

            // get organization s3 501c3 if exists

            if (this.org.doc501c3.length > 0) {
                console.log('has 501c3', this.org.doc501c3[0]);
                this.hasUpload501c3 = true;

                this.doc501c3 = this.org.doc501c3[0];

                this.status = this.doc501c3.status;

                // set status
                this.setStatus(this.status);
            } else {
                this.hasUpload501c3 = false;
                // this.canUpload501c3 = false;
            }
            this.canUpload501c3 = false;
        });
    }
    uploadNew501c3(): void {
        // this.canUpload501c3 = true;
        this.hasUpload501c3 = false;
    }
}
