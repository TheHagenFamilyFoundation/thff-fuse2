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

import { AuthService } from 'app/core/auth/auth.service';
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
    apiUrl: string;

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
        private authService: AuthService,
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

        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('OrganizationInfoComponent - this.apiUrl', this.apiUrl);
        }
    }

    ngOnInit(): void {
        this.getUser();
    }

    //retrieve the user from localStorage
    getUser(): void {
        if (localStorage.getItem('currentUser')) {
            console.log(
                'localStorage. currentUser',
                localStorage.getItem('currentUser')
            );

            // logged in so return true
            this.user = JSON.parse(localStorage.getItem('currentUser'));
            this.userId = this.user.id;
            this.userEmail = this.user.email;
        } else {
            // not logged in - redirect to home?
            this.router.navigate(['/sign-in']);
        }
    } // end of getUserName

    descriptionChange(): void {
        console.log('descriptionChange');

        this.showMessage = false;
    }

    legalNameChange(): void {
        console.log('legalNameChange');

        this.showMessage = false;
    }

    yearFoundedChange(): void {
        console.log('yearFoundedChange');

        this.showMessage = false;
    }

    currentOperatingBudgetChange(): void {
        console.log('currentOperatingBudgetChange');
        this.showMessage = false;
    }

    directorChange(): void {
        console.log('directorChange');

        this.showMessage = false;
    }

    stateChange(): void {
        console.log('stateChange');

        this.showMessage = false;
    }

    cityChange(): void {
        console.log('cityChange');

        this.showMessage = false;
    }

    addressChange(): void {
        console.log('addressChange');

        this.showMessage = false;
    }

    emailChange(): void {
        console.log('emailChange');

        this.showMessage = false;
    }

    contactPersonChange(): void {
        console.log('contactPersonChange');

        this.showMessage = false;
    }

    contactPersonTitleChange(): void {
        console.log('contactPersonTitleChange');

        this.showMessage = false;
    }

    contactPersonPhoneNumberChange(): void {
        console.log('contactPersonPhoneNumberChange');

        this.showMessage = false;
    }

    phoneChange(): void {
        console.log('phoneChange');

        this.showMessage = false;
    }

    zipChange(): void {
        console.log('zipChange');

        this.showMessage = false;
    }

    websiteChange(): void {
        console.log('websiteChange');

        this.showMessage = false;
    }

    defaultValues(): void {
        console.log('default values');

        // //organization object
        // this.description = '';

        // //org information object
        // this.orgObj = {
        //   legalName :'',
        //   yearFounded: 0,
        //   currentOperatingBudget: 0,
        //   director: '',
        //   phone: '',
        //   contactPerson: '',
        //   contactPersonTitle: '',
        //   contactPersonPhoneNumber: '',
        //   email: '',
        //   address: '',
        //   city: '',
        //   state: '',
        //   zip: 0,
        //   website: ''
        //   };

        /*********** Testing *********/
        this.orgObj = {
            legalName: 'Test Organization 61',
            yearFounded: 2023,
            currentOperatingBudget: 1,
            director: 'test',
            phone: '1231233211',
            contactPerson: 'test',
            contactPersonTitle: 'test title',
            contactPersonPhoneNumber: '1231233211',
            email: 'test@mailinator.com',
            address: '123 all street',
            city: 'test',
            state: 'fl',
            zip: 32323,
            website: '',
        };

        this.description = 'testing description';

        this.initGroupedForm();
    }

    initGroupedForm(): void {
        console.log('initializing grouped form');
        console.log('org obj - ', this.orgObj.legalName);

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
        console.log('creating organization');
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
            userId: this.userId,
            orgInfo: this.orgObj,
            description: this.description,
        };
        console.log('body before create', body);
        this.createOrganization(body);
    }

    cancel(): void {
        //route to main/home
        this.router.navigate(['/welcome']);
    }

    createOrganization(body): void {
        // call the service
        this.createOrganizationService.createOrganization(body).subscribe(
            (result) => {
                console.log('Org Info Created', result);
                //route to the org page
                // this.router.navigate(['pages/organization/']);
                this.router.navigate([
                    `/pages/organization/${result.org.organizationID}`,
                ]);
            },
            (err) => {
                console.log(err);
                this.message = err.error.message;
                this.showMessage = true;
                setTimeout(() => {
                    this.showMessage = false;
                }, 3000);
            }
        );
    }
}
