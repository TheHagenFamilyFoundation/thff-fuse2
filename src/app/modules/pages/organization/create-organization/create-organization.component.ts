import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
    FormControl,
    FormGroup,
    Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CreateOrganizationService } from 'app/core/services/organization/create-organization.service';

import { environment } from 'environments/environment';
import { Router } from '@angular/router';

@Component({
    standalone: false,
    selector: 'app-create-organization',
    templateUrl: './create-organization.component.html',
    styleUrls: ['./create-organization.component.scss'],
})
export class CreateOrganizationComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    apiUrl = environment.apiUrl;

    orgObj: any;

    showMessage = false;

    message: string;

    user: any;

    userId: any;

    userEmail: string;

    public groupedForm: FormGroup;

    constructor(
        private createOrganizationService: CreateOrganizationService,
        private router: Router
    ) {
        this.defaultValues();
    }

    ngOnInit(): void {
        this.getUser();

        this.groupedForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.showMessage = false;
            });
    }

    //retrieve the user from localStorage
    getUser(): void {
        if (localStorage.getItem('currentUser')) {
            this.user = JSON.parse(localStorage.getItem('currentUser'));
            this.userId = this.user._id;
            this.userEmail = this.user.email;
        } else {
            // not logged in - redirect to home?
            this.router.navigate(['/sign-in']);
        }
    }

    defaultValues(): void {
        this.orgObj = {
            legalName: '',
            yearFounded: 0,
            currentOperatingBudget: 0,
            director: '',
            phone: '',
            contactPerson: '',
            contactPersonTitle: '',
            contactPersonPhoneNumber: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zip: 0,
            website: '',
        };

        this.initGroupedForm();
    }

    initGroupedForm(): void {
        const req = Validators.required;

        this.groupedForm = new FormGroup({
            description: new FormControl(''),
            legalName: new FormControl(this.orgObj.legalName, req),
            yearFounded: new FormControl(this.orgObj.yearFounded, req),
            currentOperatingBudget: new FormControl(
                this.orgObj.currentOperatingBudget,
                [req, Validators.min(1)]
            ),
            director: new FormControl(this.orgObj.director, req),
            phone: new FormControl(this.orgObj.phone, req),
            contactPerson: new FormControl(this.orgObj.contactPerson, req),
            contactPersonTitle: new FormControl(
                this.orgObj.contactPersonTitle,
                req
            ),
            contactPersonPhoneNumber: new FormControl(
                this.orgObj.contactPersonPhoneNumber,
                req
            ),
            email: new FormControl(this.orgObj.email, req),
            address: new FormControl(this.orgObj.address, req),
            city: new FormControl(this.orgObj.city, req),
            state: new FormControl(this.orgObj.state, req),
            zip: new FormControl(this.orgObj.zip, req),
            website: new FormControl(this.orgObj.website),
        });
    }

    private num(v: unknown, fallback = 0): number {
        if (v === '' || v === null || v === undefined) {
            return fallback;
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    createOrg(): void {
        if (!this.groupedForm.valid) {
            return;
        }

        const v = this.groupedForm.getRawValue();

        this.orgObj = {
            legalName: v.legalName ?? '',
            yearFounded: this.num(v.yearFounded),
            currentOperatingBudget: this.num(v.currentOperatingBudget),
            director: v.director ?? '',
            phone: v.phone ?? '',
            contactPerson: v.contactPerson ?? '',
            contactPersonTitle: v.contactPersonTitle ?? '',
            contactPersonPhoneNumber: v.contactPersonPhoneNumber ?? '',
            email: v.email ?? '',
            address: v.address ?? '',
            city: v.city ?? '',
            state: v.state ?? '',
            zip: this.num(v.zip),
            website: v.website ?? '',
        };

        const body = {
            userId: this.userId,
            orgInfo: this.orgObj,
            description: v.description ?? '',
        };
        this.createOrganization(body);
    }

    cancel(): void {
        this.router.navigate(['/pages/organizations']);
    }

    createOrganization(body): void {
        this.createOrganizationService.createOrganization(body).subscribe(
            (result) => {
                this.router.navigate([
                    `/pages/organization/${result.org.organizationID}`,
                ]);
            },
            (err) => {
                this.message = err.error.message;
                this.showMessage = true;
                setTimeout(() => {
                    this.showMessage = false;
                }, 3000);
            }
        );
    }
}
