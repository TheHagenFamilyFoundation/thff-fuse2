import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
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
    standalone: false,
    selector: 'app-org-doc501c3',
    templateUrl: './org-doc501c3.component.html',
    styleUrls: ['./org-doc501c3.component.scss'],
})
export class OrgDoc501c3Component implements OnInit, OnChanges {
    @Output()
    refreshOrg = new EventEmitter<boolean>();

    @Input()
    org: any;

    /** After upload, GET /organization can briefly omit doc501c3; do not clear UI until this expires. */
    private _suppress501c3EmptyUntil = 0;
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
        private _cdr: ChangeDetectorRef,
        public upload501c3Service: Upload501c3Service,
        public getOrganizationService: GetOrganizationService,
        public doc501c3StatusService: Doc501c3StatusService,
        public delete501c3Service: Delete501c3Service,
        public get501c3Service: Get501c3Service,
        public create501c3Service: Create501c3Service
    ) { }

    ngOnInit(): void {
        this.applyOrgState(this.org);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['org']) {
            this.applyOrgState(changes['org'].currentValue);
        }
    }

    setStatus(s: number): void {
        this.outputStatus = this.configureStatus(s);

        if (s === 3) {
            this.rejected501c3 = true;
        } else {
            this.rejected501c3 = false;
        }
    }

    // takes in a status s that is a number
    configureStatus(s: number): string {
        return this.doc501c3StatusService.getStatus(s);
    }

    get501c3(): void {
        const docId = this.resolveDocId(this.doc501c3);
        if (!docId) {
            return;
        }
        this.get501c3Service.view501c3(docId).subscribe((blob) => {
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
            if (!uploaded) {
                return;
            }

            // Avoid parent/ngOnChanges + stale GET wiping "uploaded" UI for a short window.
            this._suppress501c3EmptyUntil = Date.now() + 12000;

            // Optimistic UI from upload response (shape varies by HttpClient version).
            const responseOrg = uploaded?.org ?? uploaded?.body?.org;
            const responseDoc =
                responseOrg?.doc501c3 ?? uploaded?.doc501c3 ?? uploaded?.body?.doc501c3;
            this.hasUpload501c3 = true;
            if (responseDoc) {
                this.doc501c3 =
                    typeof responseDoc === 'object'
                        ? responseDoc
                        : { _id: responseDoc };
                const responseStatus =
                    typeof responseDoc === 'object' && responseDoc
                        ? responseDoc.status
                        : null;
                if (typeof responseStatus === 'number') {
                    this.setStatus(responseStatus);
                } else {
                    this.outputStatus = this.outputStatus || 'Submitted';
                    this.rejected501c3 = false;
                }
            } else {
                this.outputStatus = this.outputStatus || 'Submitted';
                this.rejected501c3 = false;
            }

            // Single source of truth: parent refetches org (cache-busted) so all sections stay in sync.
            this.refreshOrg.emit(true);
            this._cdr.detectChanges();

            this.getOrganizationWithRetry(this.orgID);
        });
    }

    private applyOrgState(org: any): void {
        if (!org) {
            this.hasUpload501c3 = false;
            this.doc501c3 = null;
            this.outputStatus = null;
            this.rejected501c3 = false;
            return;
        }

        this.org = org;
        this.orgID = this.org.organizationID;
        this.organizationID = this.org.id;

        if (this.org.doc501c3) {
            this._suppress501c3EmptyUntil = 0;
            this.hasUpload501c3 = true;
            this.doc501c3 = this.org.doc501c3;
            this.status = this.doc501c3.status;
            this.setStatus(this.status);
            return;
        }

        if (Date.now() < this._suppress501c3EmptyUntil) {
            return;
        }

        this.hasUpload501c3 = false;
        this.doc501c3 = null;
        this.outputStatus = null;
        this.rejected501c3 = false;
    }

    private getOrganizationWithRetry(orgID: string, attemptsLeft = 12): void {
        this.getOrganizationService.getOrgbyID(orgID, true).subscribe({
            next: (org) => {
                if (org?.doc501c3) {
                    this.applyOrgState(org);
                    return;
                }

                // Preserve optimistic uploaded state while backend/read model catches up.
                if (!this.hasUpload501c3) {
                    this.applyOrgState(org);
                }

                if (attemptsLeft > 1) {
                    setTimeout(() => this.getOrganizationWithRetry(orgID, attemptsLeft - 1), 500);
                    return;
                }

                // Final attempt with no doc: only reset if we never showed uploaded state.
                if (!this.hasUpload501c3) {
                    this.applyOrgState(org);
                }
            },
            error: (err) => {
                console.error('getOrgByID error:', err);
            }
        });
    }

    getOrganization(orgID): void {
        this.getOrganizationService.getOrgbyID(orgID).subscribe({
            next: (org) => {
                this.applyOrgState(org);
            },
            error: (err) => {
                console.error('getOrgByID error:', err);
            }
        });
    }

    private resolveDocId(doc: any): string | null {
        if (!doc) {
            return null;
        }
        if (typeof doc === 'string') {
            return doc;
        }
        if (typeof doc === 'object' && doc._id) {
            return String(doc._id);
        }
        return null;
    }
}
