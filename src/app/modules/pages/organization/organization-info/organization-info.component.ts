import {
    Component,
    OnInit,
    Input,
    Renderer2,
    ViewChild,
    ElementRef,
    Output,
    EventEmitter,
} from '@angular/core';
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
import { ErrorStateMatcher } from '@angular/material/core';

// import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { environment } from 'environments/environment';

// Services
import { CreateOrganizationInfoService } from 'app/core/services/organization/organization-info/create-organization-info.service';
import { UpdateOrganizationInfoService } from 'app/core/services/organization/organization-info/update-organization-info.service';
import { GetOrganizationInfoService } from 'app/core/services/organization/organization-info/get-organization-info.service';
import { DeleteOrganizationInfoService } from 'app/core/services/organization/organization-info/delete-organization-info.service';

import { AuthService } from 'app/core/auth/auth.service';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-organization-info',
    templateUrl: './organization-info.component.html',
    styleUrls: ['./organization-info.component.scss'],
})
export class OrganizationInfoComponent implements OnInit {
    @Input()
    org: any;
    @Output() refreshOrg = new EventEmitter<boolean>();
    @Input()
    isDirector: any;
    @Input()
    inOrg: any; //used for director

    // multiple form
    public mode: 'view' | 'edit' = 'view';

    apiUrl: string;

    orgID: any;

    orgInfo: any;

    orgInfoCreated: boolean = false;

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

    isReadOnly: boolean = true;

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

    loaded = false;

    showMessage = false;

    message: any;

    canSave = true;

    editing = false;
    editingLegalName: boolean = false;

    directorEditing = false;

    formContactPerson: FormGroup;

    formOrganization: FormGroup;

    formWebsite: FormGroup;

    emailFormControl = new FormControl('', [
        Validators.required,
        Validators.email,
    ]);

    addressFormControl = new FormControl('', [Validators.required]);

    cityFormControl = new FormControl('', [Validators.required]);

    stateFormControl = new FormControl('', [Validators.required]);

    zipFormControl = new FormControl('', [Validators.required]);

    websiteFormControl = new FormControl('', [Validators.required]);

    //TODO: example, delete after
    public inputText = 'foo';
    public inputControl: FormControl = new FormControl(this.inputText);

    //keep
    public legalNameControl: FormControl;
    public yearFoundedControl: FormControl;
    public currentOperatingBudgetControl: FormControl;
    public directorControl: FormControl;
    public phoneControl: FormControl;
    public contactPersonControl: FormControl;
    public contactPersonTitleControl: FormControl;
    public contactPersonPhoneNumberControl: FormControl;
    public emailControl: FormControl;
    public addressControl: FormControl;
    public cityControl: FormControl;
    public stateControl: FormControl;
    public zipControl: FormControl;
    public websiteControl: FormControl;

    public nameControl: FormControl = new FormControl(this.inputText);

    //edit in place formcontrols
    // public legalNameControl: FormControl = null;

    public groupedForm: FormGroup;
    // public identity = {
    //   name: 'John Doe',
    //   city: 'London',
    //   country: 'England',
    // };

    //default values
    public orgObj: any;
    //     legalName :'',
    //     yearFounded: 0,
    //     currentOperatingBudget: '',
    //     director: '',
    //     phone: '',
    //     contactPerson: '',
    //     contactPersonTitle: '',
    //     contactPersonPhoneNumber: '',
    //     email: '',
    //     address: '',
    //     city: '',
    //     state: '',
    //     zip: 0,
    //     website: ''
    // };

    public invalidInputLegalName: boolean = false;
    public invalidInputYearFounded: boolean = false;
    public invalidInputCurrentOperatingBudget: boolean = false;
    public invalidInputDirector: boolean = false;
    public invalidInputPhone: boolean = false;
    public invalidInputContactPerson: boolean = false;
    public invalidInputContactPersonTitle: boolean = false;
    public invalidInputContactPersonPhoneNumber: boolean = false;
    public invalidInputEmail: boolean = false;
    public invalidInputAddress: boolean = false;
    public invalidInputCity: boolean = false;
    public invalidInputState: boolean = false;
    public invalidInputZip: boolean = false;

    public invalidInputMap = null;

    constructor(
        private createOrganizationInfoService: CreateOrganizationInfoService,
        private updateOrganizationInfoService: UpdateOrganizationInfoService,
        private getOrganizationInfoService: GetOrganizationInfoService,
        private deleteOrganizationInfoService: DeleteOrganizationInfoService,
        private authService: AuthService,
        fb: FormBuilder
    ) {
        //main edit mode
        this.formContactPerson = fb.group({
            contactPersonPhoneNumber: new FormControl('', Validators.required),
            contactPersonTitle: new FormControl('', Validators.required),
            contactPerson: new FormControl('', Validators.required),
            email: new FormControl('', [Validators.required, Validators.email]),
        });

        this.formOrganization = fb.group({
            legalName: new FormControl('', Validators.required),
            yearFounded: new FormControl('', Validators.required),
            currentOperatingBudget: new FormControl('', [
                Validators.required,
                Validators.min(1),
            ]),
            director: new FormControl('', Validators.required),
            phone: new FormControl('', Validators.required),
        });

        this.formWebsite = fb.group({
            website: [''],
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

        console.log('OrganizationInfoComponent - this.apiUrl', this.apiUrl);

        // const invalidInputMap = new Map<string, boolean>([
        //     ['legalName', false],
        //     ['yearFounded', false],
        //     ['currentOperatingBudget', false],
        //     ['director', false],
        //     ['phone', false],
        //     ['contactPerson', false],
        //     ['contactPersonTitle', false],
        //     ['contactPersonPhoneNumber', false],
        //     ['email', false],
        //     ['address', false],
        //     ['city', false],
        //     ['state', false],
        //     ['zip', false]
        // ]);
    } // end of constructor

    defaultValues(): void {
        console.log('defaulting values');

        //main
        this.legalName = '';
        this.yearFounded = 0;
        this.currentOperatingBudget = 0;
        this.director = '';
        this.phone = '';
        this.contactPerson = '';
        this.contactPersonTitle = '';
        this.contactPersonPhoneNumber = '';
        this.email = '';
        this.address = '';
        this.city = '';
        this.state = '';
        this.zip = 0;
        this.website = '';

        // //edit in place
        // this.legalNameControl = '';
    }

    ngOnInit(): void {
        console.log('this.org', this.org);

        console.log('this.org.organizationID', this.org.organizationID);
        this.orgID = this.org._id;

        this.getOrganizationInfo();
    }

    getOrganizationInfo(): void {
        console.log('getting Organization Info');

        this.getOrganizationInfoService
            .getOrgInfobyOrgID(this.orgID)
            .subscribe((orgInfo) => {
                if (orgInfo) {
                    console.log('orgInfo', orgInfo);
                    this.orgInfo = orgInfo;
                    console.log('this.orgInfo._id', this.orgInfo._id);

                    this.setFields();
                } else {
                    // default values
                    //create one
                    console.log('no orgInfo');
                    this.setFields();
                    this.orgInfo = this.orgObj;

                    //create orgInfo
                    console.log('creating org Info - body:', this.orgInfo);
                    console.log(
                        'org object to pass in as organization',
                        this.org
                    );
                    this.orgInfo.organization = this.org._id;
                    this.createOrganizationInfo(this.orgInfo);
                }
            });
    }

    createOrganizationInfo(body): void {
        // call the service
        this.createOrganizationInfoService
            .createOrganizationInfo(body)
            .subscribe(
                (result) => {
                    console.log('Org Info Created', result.result);
                    this.orgInfo = result.result;

                    console.log('new this.orgInfo._id', this.orgInfo._id);
                },
                (err) => {
                    console.log(err);
                }
            );
    }

    deleteOrganizationInfo(): void {
        console.log('getting Organization Info');

        this.deleteOrganizationInfoService
            .deleteOrgInfobyOrgInfoID(this.orgInfo._id)
            .subscribe((result) => {
                console.log('result', result);

                return result;
            });
    }

    setFields(): void {
        console.log('setting fields');

        if (this.orgInfo) {
            console.log('yes');

            if (this.orgInfo.legalName) {
                console.log('this.orgInfo.legalName', this.orgInfo.legalName);
                this.legalName = this.orgInfo.legalName;
            }

            if (this.orgInfo.yearFounded) {
                this.yearFounded = this.orgInfo.yearFounded;
            }

            if (this.orgInfo.yearFounded) {
                this.yearFounded = this.orgInfo.yearFounded;
            }

            if (this.orgInfo.currentOperatingBudget) {
                this.currentOperatingBudget =
                    this.orgInfo.currentOperatingBudget;
            }

            if (this.orgInfo.director) {
                this.director = this.orgInfo.director;
            }

            if (this.orgInfo.phone) {
                this.phone = this.orgInfo.phone;
            }

            if (this.orgInfo.contactPerson) {
                this.contactPerson = this.orgInfo.contactPerson;
            }

            if (this.orgInfo.contactPersonTitle) {
                this.contactPersonTitle = this.orgInfo.contactPersonTitle;
            }

            if (this.orgInfo.contactPersonPhoneNumber) {
                this.contactPersonPhoneNumber =
                    this.orgInfo.contactPersonPhoneNumber;
            }

            if (this.orgInfo.email) {
                this.email = this.orgInfo.email;
            }

            if (this.orgInfo.address) {
                this.address = this.orgInfo.address;
            }

            if (this.orgInfo.city) {
                this.city = this.orgInfo.city;
            }

            if (this.orgInfo.state) {
                this.state = this.orgInfo.state;
            }

            if (this.orgInfo.zip) {
                this.zip = this.orgInfo.zip;
            }

            if (this.orgInfo.website) {
                this.website = this.orgInfo.website;
            }

            this.orgObj = {
                legalName: this.legalName,
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
        } else {
            console.log('default values');

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
        }

        this.initGroupedForm();
    }

    //when toggling the full form
    resetFormValues(): void {
        console.log('reseting form values');

        this.formOrganization.setValue({
            legalName: this.legalName,
            yearFounded: this.yearFounded,
            currentOperatingBudget: this.currentOperatingBudget,
            director: this.director,
            phone: this.phone,
        });

        this.formContactPerson.setValue({
            contactPersonPhoneNumber: this.contactPersonPhoneNumber,
            contactPersonTitle: this.contactPersonTitle,
            contactPerson: this.contactPerson,
            email: this.email,
        });

        this.websiteFormControl.setValue(this.website);
        this.emailFormControl.setValue(this.email);
        this.addressFormControl.setValue(this.address);
        this.cityFormControl.setValue(this.city);
        this.stateFormControl.setValue(this.state);
        this.zipFormControl.setValue(this.zip);

        // this.initFormControls();
        this.initGroupedForm();
    }

    //maybe old
    edit(): void {
        console.log('edit pressed');

        this.formOrganization.setValue({
            legalName: this.legalName,
            yearFounded: this.yearFounded,
            currentOperatingBudget: this.currentOperatingBudget,
            director: this.director,
            phone: this.phone,
        });

        this.formContactPerson.setValue({
            contactPersonPhoneNumber: this.contactPersonPhoneNumber,
            contactPersonTitle: this.contactPersonTitle,
            contactPerson: this.contactPerson,
            email: this.email,
        });

        this.websiteFormControl.setValue(this.website);
        this.emailFormControl.setValue(this.email);
        this.addressFormControl.setValue(this.address);
        this.cityFormControl.setValue(this.city);
        this.stateFormControl.setValue(this.state);
        this.zipFormControl.setValue(this.zip);

        // this.formOrganization.get;
        this.editing = true;
    }

    save(): void {
        console.log('save pressed');
        // the first time is create - the second time is a delete and create

        this.editing = false;

        const body = {
            legalName: this.legalName,
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
            organization: this.orgID,
        };

        console.log('body', body);

        if (this.orgInfo) {
            this.deleteOrganizationInfoService
                .deleteOrgInfobyOrgInfoID(this.orgInfo._id)
                .subscribe((result) => {
                    console.log('result', result);

                    this.createOrganizationInfo(body);
                });
        } else {
            this.createOrganizationInfo(body);
        }
    }

    // cancel changes, retrieve the old from the db
    mainCancel(): void {
        this.editing = false;

        this.getOrganizationInfo();
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

    receiveChildData(data): void {
        console.log(data);
    }

    editLegalName(): void {
        console.log('editLegalName - editing legal name');

        this.editingLegalName = true;

        // //check for change
        // this.isReadOnly = !this.isReadOnly;
    }

    //new stuff

    initGroupedForm(): void {
        console.log('initializing grouped form');
        console.log('org obj - ', this.orgObj.legalName);

        this.groupedForm = new FormGroup({
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

        this.initFormControls();
    }

    initFormControls(): void {
        console.log('initializing form controls');
        console.log('this.legalName', this.legalName);

        // this.inputControl = new FormControl(this.identity.country);
        // this.nameControl = new FormControl(this.identity.name);
        this.legalNameControl = new FormControl(this.legalName);
        this.yearFoundedControl = new FormControl(this.yearFounded);
        this.currentOperatingBudgetControl = new FormControl(
            this.currentOperatingBudget
        );
        this.directorControl = new FormControl(this.director);
        this.phoneControl = new FormControl(this.phone);
        this.contactPersonControl = new FormControl(this.contactPerson);
        this.contactPersonTitleControl = new FormControl(
            this.contactPersonTitle
        );
        this.contactPersonPhoneNumberControl = new FormControl(
            this.contactPersonPhoneNumber
        );
        this.emailControl = new FormControl(this.email);
        this.addressControl = new FormControl(this.address);
        this.cityControl = new FormControl(this.city);
        this.stateControl = new FormControl(this.state);
        this.zipControl = new FormControl(this.zip);
        this.websiteControl = new FormControl(this.website);
    }

    //sets the fields to the updated value
    //then calls the save single field function to call the database
    updateSingleField(prop: any, control: any): void {
        console.log('prop', prop);
        console.log('control', control);
        console.log('org info - updateSingleField', this[control].value);

        if (this[control].value === '') {
            console.log('blank value');
            //reset the value
            console.log('old value', this.orgObj[prop]);
            this[control].value = this.orgObj[prop];

            this.checkInvalidProp(prop, true);

            // this.invalidInputLegalName = true;
            setTimeout(() => {
                // this.invalidInputLegalName = false;
                this.checkInvalidProp(prop, false);
            }, 2000);
        } else {
            this[prop] = this[control].value;
            this.orgObj[prop] = this[control].value;
            const change = {
                [prop]: this[control].value,
            };
            this.saveSingleField(change);
        }
    }

    checkInvalidProp(prop: string, flag: boolean): void {
        // console.log('checkInvalidProp - prop',prop);
        // console.log('checkInvalidProp - flag',flag);

        switch (prop) {
            case 'legalName': {
                this.invalidInputLegalName = flag;
                break;
            }
            case 'yearFounded': {
                this.invalidInputYearFounded = flag;
                break;
            }
            case 'currentOperatingBudget': {
                this.invalidInputCurrentOperatingBudget = flag;
                break;
            }
            case 'director': {
                this.invalidInputDirector = flag;
                break;
            }
            case 'phone': {
                this.invalidInputPhone = flag;
                break;
            }
            case 'contactPerson': {
                this.invalidInputContactPerson = flag;
                break;
            }
            case 'contactPersonTitle': {
                this.invalidInputContactPersonTitle = flag;
                break;
            }
            case 'contactPersonPhoneNumber': {
                this.invalidInputContactPersonPhoneNumber = flag;
                break;
            }
            case 'email': {
                this.invalidInputEmail = flag;
                break;
            }
            case 'address': {
                this.invalidInputAddress = flag;
                break;
            }
            case 'city': {
                this.invalidInputCity = flag;
                break;
            }
            case 'state': {
                this.invalidInputState = flag;
                break;
            }
            case 'zip': {
                this.invalidInputZip = flag;
                break;
            }
            default: {
                console.error('invalid switch prop');
                break;
            }
        }
    }

    //takes in the field that changed
    saveSingleField(change: any): void {
        console.log('save single field');

        const body = change;

        console.log('saveSingleField - body', body);
        this.updateOrganizationInfo(body);
    }

    //calls the updateOrganizationService
    updateOrganizationInfo(body: any): void {
        console.log('updateOrganizationInfo', body);

        this.updateOrganizationInfoService
            .updateOrganizationInfo(this.orgInfo.organizationInfoID, body)
            .subscribe(
                (result) => {
                    console.log('Org Info updated', result);
                    this.orgInfo = result.info;

                    console.log(
                        'new this.orgInfo.organizationInfoID',
                        this.orgInfo.organizationInfoID
                    );

                    this.refreshOrg.emit(true);
                    this.resetFormValues();
                },
                (err) => {
                    console.log(err);
                }
            );
    }

    cancelSingleField(prop: string, control: any): void {
        console.log('org info - cancelSingleField', this[control].value);
        (this[control] as AbstractControl).setValue(this[prop]);
    }

    updateGroupedEdition(): void {
        console.log('change - this.legalName', this.legalName);

        // console.log('org info - updateGroupedEdition',this.groupedForm.value);
        console.log('old - this.orgObj', this.orgObj);

        // this.orgObj = this.groupedForm.value; //out of date
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
            organization: this.orgID,
        };

        console.log('new - this.orgObj', this.orgObj);

        this.updateOrganizationInfoService
            .updateOrganizationInfo(
                this.orgInfo.organizationInfoID,
                this.orgObj
            )
            .subscribe(
                (result) => {
                    console.log('Org Info updated', result);
                    this.orgInfo = result.info;

                    console.log(
                        'new this.orgInfo.organizationInfoID',
                        this.orgInfo.organizationInfoID
                    );
                    this.refreshOrg.emit(true);
                    this.resetFormValues();
                },
                (err) => {
                    console.log(err);
                }
            );
    }

    cancelGroupedEdition(): void {
        console.log('org info - cancelGroupedEdition');
        // this.groupedForm.setValue(this.orgObj);

        //reset values
        this.setFields();
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        console.log('org info - toggle mode change', mode);
        this.mode = mode;

        this.resetFormValues();

        this.checkEditing(mode);
    }

    toggleDirectorEdit(): void {
        this.directorEditing = !this.directorEditing;
        this.mode = 'view';
        this.checkEditing(this.mode);
    }

    checkEditing(mode): void {
        if (mode === 'view') {
            this.editing = false;
        } else {
            this.editing = true;
        }
    }

}
