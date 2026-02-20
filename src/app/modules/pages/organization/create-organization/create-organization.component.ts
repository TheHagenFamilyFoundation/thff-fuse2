import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormGroup,
    FormControl,
    FormGroupDirective,
    NgForm,
    Validators,
} from '@angular/forms';

import { Observable, Subject } from 'rxjs';

import { CreateOrganizationService } from 'app/core/services/organization/create-organization.service';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-organization',
    templateUrl: './create-organization.component.html',
    styleUrls: ['./create-organization.component.scss'],
})
export class CreateOrganizationComponent implements OnInit {
    apiUrl = environment.apiUrl;

    //org object
    orgObj: any;

    description$ = new Subject<string>();

    legalName$ = new Subject<string>();

    yearFounded$ = new Subject<string>();

    currentOperatingBudget$ = new Subject<string>();

    director$ = new Subject<string>();

    phone$ = new Subject<string>();

    contactPerson$ = new Subject<string>();

    contactPersonTitle$ = new Subject<string>();

    contactPersonPhoneNumber$ = new Subject<string>();

    email$ = new Subject<string>();

    address$ = new Subject<string>();

    city$ = new Subject<string>();

    state$ = new Subject<string>();

    zip$ = new Subject<string>();

    website$ = new Subject<string>();

    description: string;

    legalName: string;

    //  -Legal Name of Organization Applying:
    yearFounded: number;

    // -Year Founded
    currentOperatingBudget: number;

    // -Current Operating Budget
    director: string;

    // -Executive Director
    phone: string;

    // -Phone Number
    contactPerson: string;

    // -Contact person/title/phone number
    contactPersonTitle: string;

    contactPersonPhoneNumber: string;

    email: string;

    // -Email Address
    address: string;

    // -Address (principal/administrative office)
    city: string;

    // -City
    state: string;

    // -State
    zip: number;

    website: string;

    showMessage = false;

    message: string;

    user: any;

    // object
    userId: any;

    // string
    userEmail: string;

    public groupedForm: FormGroup;

    constructor(
        fb: FormBuilder,
        private createOrganizationService: CreateOrganizationService,
        private router: Router
    ) {
        this.description$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.description = term;
                this.descriptionChange();
            });

        this.legalName$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.legalName = term;
                this.legalNameChange();
            });

        this.yearFounded$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.yearFounded = Number(term);
                this.yearFoundedChange();
            });

        this.currentOperatingBudget$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.currentOperatingBudget = Number(term);
                this.currentOperatingBudgetChange();
            });

        this.director$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.director = term;
                this.directorChange();
            });

        this.phone$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.phone = term;
                this.phoneChange();
            });

        this.contactPerson$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.contactPerson = term;
                this.contactPersonChange();
            });

        this.contactPersonTitle$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.contactPersonTitle = term;
                this.contactPersonTitleChange();
            });

        this.contactPersonPhoneNumber$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.contactPersonPhoneNumber = term;
                this.contactPersonPhoneNumberChange();
            });

        this.email$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.email = term;
                this.emailChange();
            });

        this.address$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.address = term;
                this.addressChange();
            });

        this.city$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.city = term;
                this.cityChange();
            });

        this.state$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.state = term;
                this.stateChange();
            });

        this.zip$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.zip = Number(term);
                this.zipChange();
            });

        this.website$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.website = term;
                this.websiteChange();
            });

        this.defaultValues();
    }

    ngOnInit(): void {
        this.getUser();
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
    } // end of getUserName

    descriptionChange(): void {
        this.showMessage = false;
    }

    legalNameChange(): void {
        this.showMessage = false;
    }

    yearFoundedChange(): void {
        this.showMessage = false;
    }

    currentOperatingBudgetChange(): void {
        this.showMessage = false;
    }

    directorChange(): void {
        this.showMessage = false;
    }

    stateChange(): void {
        this.showMessage = false;
    }

    cityChange(): void {
        this.showMessage = false;
    }

    addressChange(): void {
        this.showMessage = false;
    }

    emailChange(): void {
        this.showMessage = false;
    }

    contactPersonChange(): void {
        this.showMessage = false;
    }

    contactPersonTitleChange(): void {
        this.showMessage = false;
    }

    contactPersonPhoneNumberChange(): void {
        this.showMessage = false;
    }

    phoneChange(): void {
        this.showMessage = false;
    }

    zipChange(): void {
        this.showMessage = false;
    }

    websiteChange(): void {
        this.showMessage = false;
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
        this.groupedForm = new FormGroup({
            description: new FormControl(this.description),
            legalName: new FormControl(this.orgObj.legalName),
            yearFounded: new FormControl(this.orgObj.yearFounded),
            currentOperatingBudget: new FormControl(
                this.orgObj.currentOperatingBudget,
                [Validators.required, Validators.min(1)]
            ),
            director: new FormControl(this.orgObj.director),
            phone: new FormControl(this.orgObj.phone),
            contactPerson: new FormControl(this.orgObj.contactPerson),
            contactPersonTitle: new FormControl(this.orgObj.contactPersonTitle),
            contactPersonPhoneNumber: new FormControl(
                this.orgObj.contactPersonPhoneNumber
            ),
            email: new FormControl(this.orgObj.email),
            address: new FormControl(this.orgObj.address),
            city: new FormControl(this.orgObj.city),
            state: new FormControl(this.orgObj.state),
            zip: new FormControl(this.orgObj.zip),
            website: new FormControl(this.orgObj.website),
        });
    }

    createOrg(): void {
        this.orgObj = {
            legalName: this.legalName, //changed
            yearFounded: this.yearFounded,
            currentOperatingBudget: this.currentOperatingBudget,
            director: this.director,
            phone: this.phone,
            contactPerson: this.contactPerson,
            contactPersonTitle: this.contactPersonTitle,
            contactPersonPhoneNumber: this.contactPersonPhoneNumber,
            email: this.email,
            address: this.address,
            city: this.city,
            state: this.state,
            zip: this.zip,
            website: this.website,
        };
        const body = {
            userId: this.userId, //remove
            orgInfo: this.orgObj,
            description: this.description,
        };
        this.createOrganization(body);
    }

    cancel(): void {
        this.router.navigate(['/pages/organizations']);
    }

    createOrganization(body): void {
        // call the service
        this.createOrganizationService.createOrganization(body).subscribe(
            (result) => {
                // this.router.navigate(['pages/organization/']);
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
