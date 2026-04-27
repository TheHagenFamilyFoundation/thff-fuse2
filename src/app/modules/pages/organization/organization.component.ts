import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OrganizationService } from './organization.service';
import { GetOrganizationService } from 'app/core/services/organization/get-organization.service';
import { AuthService } from 'app/core/auth/auth.service';
import { isUserInOrgUsers } from 'app/core/utilities/organization-access.util';

@Component({
    standalone: false,
    selector: 'organization',
    templateUrl: './organization.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class OrganizationComponent implements OnInit, OnDestroy {
    currentUser: any;
    orgID: any;
    organizationID: any;
    org: any;
    isDirector: boolean = false;
    inOrg: boolean;
    viewing: string;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _organizationService: OrganizationService,
        private _router: Router,
        private route: ActivatedRoute,
        public getOrgService: GetOrganizationService,
        public _authService: AuthService,
        public snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {
        this.inOrg = false;
    }

    ngOnInit(): void {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

        this._authService.checkDirector().subscribe((isADirector) => {
            this.isDirector = isADirector;
            if (this.org && this.currentUser?._id) {
                this.checkInOrganization(this.currentUser._id);
            }
            this._cdr.detectChanges();
        });

        this.route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe((pm) => {
            const id = pm.get('id');
            if (!id) {
                return;
            }
            this.orgID = id;
            this.getOrganization(id);
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    getOrganization(orgID: string, forceFresh = false): void {
        this.getOrgService.getOrgbyID(orgID, forceFresh).subscribe((org) => {
            this.org = org;
            this.organizationID = this.org._id;
            this.checkInOrganization(this.currentUser._id);
            this.checkIsDirectorAndInOrg();
            this._cdr.detectChanges();
            Promise.resolve().then(() => this._cdr.detectChanges());
        });
    }

    refreshOrg(): void {
        this.getOrganization(this.orgID, true);
    }

    checkIsDirectorAndInOrg(): void {
        if (this.isDirector && !this.inOrg) {
            this.viewing = 'Viewing: ';
        }
    }

    checkInOrganization(_id: string): void {
        this.inOrg = isUserInOrgUsers(this.org?.users, _id);

        if (!this.inOrg && !this.isDirector) {
            this._router.navigate(['/welcome']);
            this.snackBar.open('You are not allowed to view this Organization', undefined, {
                duration: 3000,
            });
        }
    }

    scrollTo(sectionId: string): void {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
