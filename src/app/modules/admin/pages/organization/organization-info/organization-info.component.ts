import {
    Component,
    OnInit,
    Input,
    Renderer2,
    ViewChild,
    ElementRef,
} from '@angular/core';
import {
    AbstractControl, FormArray,
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

import { environment } from '../../../../../../environments/environment';

// Services
import { CreateOrganizationInfoService } from 'app/core/services/organization/organization-info/create-organization-info.service';
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

    /**
     * This is the toggle button element, look at HTML and see its definition
     */
    @ViewChild('toggleButton') toggleButton: ElementRef;

    @ViewChild('toggleButton2') toggleButton2: ElementRef;

 // multiple form
 public mode: 'view' | 'edit' = 'view';

    apiUrl: string;

    orgID: any;

    orgInfo: any;

    //TODO: figure out a better way to handle the field names
    //field names
    fnLegalName: string = 'Legal Name';


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

    fax$ = new Subject<string>();

    testphone$ = new Subject<string>();

    isReadOnly: boolean = true;

    legalName: string;

    //  -Legal Name of Organization Applying:
    yearFounded: number;

    // -Year Founded
    currentOperatingBudget: string;

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

    // -Zip - 5 length
    fax: string; // -Fax Number

    testphone: any;

    loaded = false;

    showMessage = false;

    message: any;

    canSave = true;

    showCurrentOperatingBudgetMessage = false;

    currentOperatingBudgetMessage: any;

    editing = false;
    editingLegalName: boolean = false;

    formContactPerson: FormGroup;

    formOrganization: FormGroup;

    formFax: FormGroup;

    emailFormControl = new FormControl('', [
        Validators.required,
        Validators.email,
    ]);

    addressFormControl = new FormControl('', [Validators.required]);

    cityFormControl = new FormControl('', [Validators.required]);

    stateFormControl = new FormControl('', [Validators.required]);

    zipFormControl = new FormControl('', [Validators.required]);

    faxFormControl = new FormControl('', [Validators.required]);

    //TODO: example, delete after
    public inputText = 'foo';
    public inputControl: FormControl = new FormControl(this.inputText);
    public nameControl: FormControl = new FormControl(this.inputText);

    //edit in place formcontrols
    public legalNameControl: FormControl = null;

    public groupedForm: FormGroup;
    public identity = {
      name: 'John Doe',
      city: 'London',
      country: 'England',
    };

    constructor(
        private createOrganizationInfoService: CreateOrganizationInfoService,
        private getOrganizationInfoService: GetOrganizationInfoService,
        private deleteOrganizationInfoService: DeleteOrganizationInfoService,
        private authService: AuthService,
        fb: FormBuilder,
        private renderer: Renderer2
    ) {




        //main edit mode
        this.formContactPerson = fb.group({
            contactPersonPhoneNumber: new FormControl('', Validators.required),
            contactPersonTitle: new FormControl('', Validators.required),
            contactPerson: new FormControl('', Validators.required),
        });

        this.formOrganization = fb.group({
            legalName: new FormControl('', Validators.required),
            yearFounded: new FormControl('', Validators.required),
            currentOperatingBudget: new FormControl('', Validators.required),
            director: new FormControl('', Validators.required),
            phone: new FormControl('', Validators.required),
        });

        this.formFax = fb.group({
            fax: [''],
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

        // this.currentOperatingBudget$.pipe(
        //   debounceTime(400),
        //   distinctUntilChanged())
        //   .subscribe(term => {

        //     this.currentOperatingBudget = Number(term);
        //     this.currentOperatingBudgetChange()
        //   });

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

        this.fax$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.fax = term;
                this.faxChange();
            });

        this.testphone$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                console.log('term = ', term);

                this.testphone = term.toString();
                this.phoneChange();
            });

        this.defaultValues();

        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('OrganizationInfoComponent - this.apiUrl', this.apiUrl);
        }

        console.log('OrganizationInfoComponent - this.apiUrl', this.apiUrl);

        // /**
        //  * This events get called by all clicks on the page
        //  */
        // this.renderer.listen('window', 'click', (e: Event) => {
        //     /**
        //      * Only run when toggleButton is not clicked
        //      * If we don't check this, all clicks (even on the toggle button) gets into this
        //      * section which in the result we might never see the menu open!
        //      * And the menu itself is checked here, and it's where we check just outside of
        //      * the menu and button the condition above must close the menu
        //      */
        //     // if(this.editingLegalName) {
        //     //     this.editingLegalName = false;
        //     // }
        //     console.log('e',e);
        //     if(this.editingLegalName){
        //         console.log('editing legal name');
        //     }

        //     // if (this.toggleButton2 && e.target !== this.toggleButton2.nativeElement && this.editingLegalName) {
        //     //     this.editingLegalName = false;
        //     // }


        // });
    } // end of constructor

    defaultValues(): void {
        console.log('defaulting values');

        //main
        this.legalName = '';
        this.yearFounded = 0;
        this.currentOperatingBudget = '';
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
        this.fax = '';

        // //edit in place
        // this.legalNameControl = '';
    }

    ngOnInit(): void {
        console.log('this.org', this.org);

        console.log('this.org.organizationID', this.org.organizationID);
        this.orgID = this.org.id;

        this.getOrganizationInfo();

        this.initGroupedForm();

        this.inputControl = new FormControl(this.identity.country);
        this.nameControl = new FormControl(this.identity.name);
    }

    getOrganizationInfo(): void {
        console.log('getting Organization Info');

        this.getOrganizationInfoService
            .getOrgInfobyOrgID(this.orgID)
            .subscribe((orgInfo) => {
                if (orgInfo.length > 0) {
                    console.log('orgInfo', orgInfo);
                    [this.orgInfo] = orgInfo;

                    console.log('this.orgInfo.id', this.orgInfo.id);

                    this.setFields();
                } else {
                    // default values
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

                    console.log('new this.orgInfo.id', this.orgInfo.id);
                },
                (err) => {
                    console.log(err);
                }
            );
    }

    deleteOrganizationInfo(): void {
        console.log('getting Organization Info');

        this.deleteOrganizationInfoService
            .deleteOrgInfobyOrgInfoID(this.orgInfo.id)
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
                this.legalName = this.orgInfo.legalName;
                // this.formOrganization.get('legalName').value = this.legalName;
            }

        //edit in place
        this.legalNameControl = new FormControl(this.legalName);

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

            if (this.orgInfo.fax) {
                this.fax = this.orgInfo.fax;
            }
        } else {
            console.log('default values');
        }
    }

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
        });

        this.faxFormControl.setValue(this.fax);
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
            fax: this.fax,
            organization: this.orgID,
        };

        console.log('body', body);

        if (this.orgInfo) {
            this.deleteOrganizationInfoService
                .deleteOrgInfobyOrgInfoID(this.orgInfo.id)
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

    currentOperatingBudgetChange(event): void {
        console.log('currentOperatingBudgetChange', event);

        if (this.currentOperatingBudget === '') {
            this.currentOperatingBudgetMessage =
                'Current Operating Budget must be positive.';

            this.showCurrentOperatingBudgetMessage = true;
            console.log('showing current op message');

            this.canSave = false;
        } else {
            this.showCurrentOperatingBudgetMessage = false;

            this.canSave = true;
        }

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

    faxChange(): void {
        console.log('faxChange');

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

    saveLegalName(): void {
        console.log('saving legal name');

    //done editing
        this.editingLegalName = false;
    }

    cancel(): void {
        this.editingLegalName = false;
        //and many more
    }

    //new stuff

    initGroupedForm(): void {
        this.groupedForm = new FormGroup({
          name: new FormControl(this.identity.name),
          city: new FormControl(this.identity.city),
          country: new FormControl(this.identity.country),
        });
      }


    updateSingleField(prop: any, control: any): void {
        console.log('org info - updateSingleField', this[control].value);
        this[prop] = this[control].value;
        console.log('prop = ', prop);
        console.log('prop value = ',this[prop]);
        this.identity = this.groupedForm.value;
      }

      cancelSingleField(prop: string, control: any): void {
        console.log('org info - cancelSingleField', this[control].value);
        (this[control] as AbstractControl).setValue(this[prop]);
      }

      updateGroupedEdition(): void {
        console.log('org info - updateGroupedEdition');
        this.identity = this.groupedForm.value;
      }

      cancelGroupedEdition(): void {
        console.log('org info - cancelGroupedEdition');
        this.groupedForm.setValue(this.identity);
      }

      handleModeChange(mode: 'view' | 'edit'): void {
        console.log('org info - toggle mode change',mode);
        this.mode = mode;
        if(mode === 'view') {
            this.editing = false;
        }
        else {
            this.editing = true;
        }
      }

}
