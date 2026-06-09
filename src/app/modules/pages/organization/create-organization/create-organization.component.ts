import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
    FormControl,
    FormGroup,
    Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { CreateOrganizationService } from 'app/core/services/organization/create-organization.service';
import {
    foundedYearSelectOptions,
    foundedYearToSelectValue,
} from 'app/core/utilities/founded-year-options';
import { normalizeZipForSave, usZipFormValidators, zipFromApiForForm } from 'app/core/utilities/us-zip';
import { thffEmailValidator, validateEmailOnBlur } from 'app/core/auth/auth-validators';

import { environment } from 'environments/environment';
import { Router } from '@angular/router';
import { FuseLoadingService } from '@fuse/services/loading';

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

    /** Descending years for “Year founded” (current year → 1800). */
    readonly foundedYearOptions = foundedYearSelectOptions();

    /** True while create API request is in flight (disables actions + shows progress). */
    creating = false;

    constructor(
        private createOrganizationService: CreateOrganizationService,
        private router: Router,
        private _fuseLoadingService: FuseLoadingService
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
            yearFounded: null,
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
            zip: '',
            website: '',
        };

        this.initGroupedForm();
    }

    initGroupedForm(): void {
        const req = Validators.required;

        this.groupedForm = new FormGroup({
            description: new FormControl(''),
            legalName: new FormControl(this.orgObj.legalName, req),
            yearFounded: new FormControl(
                foundedYearToSelectValue(this.orgObj.yearFounded),
                req,
            ),
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
            email: new FormControl(this.orgObj.email, [req, thffEmailValidator]),
            address: new FormControl(this.orgObj.address, req),
            city: new FormControl(this.orgObj.city, req),
            state: new FormControl(this.orgObj.state, req),
            zip: new FormControl(zipFromApiForForm(this.orgObj.zip), usZipFormValidators()),
            website: new FormControl(this.orgObj.website),
        });
    }

    onEmailBlur(): void {
        validateEmailOnBlur(this.groupedForm);
    }

    private num(v: unknown, fallback = 0): number {
        if (v === '' || v === null || v === undefined) {
            return fallback;
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    createOrg(): void {
        this.groupedForm.markAllAsTouched();
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
            zip: normalizeZipForSave(v.zip),
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
        this.creating = true;
        this._fuseLoadingService.show();
        this.createOrganizationService
            .createOrganization(body)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    this.creating = false;
                }),
            )
            .subscribe({
                next: (result) => {
                    this.router.navigate([
                        `/pages/organization/${result.org.organizationID}`,
                    ]);
                },
                error: (err) => {
                    this._fuseLoadingService.hide();
                    this.message = err.error?.message ?? 'Could not create organization.';
                    this.showMessage = true;
                    setTimeout(() => {
                        this.showMessage = false;
                    }, 3000);
                },
            });
    }
}
