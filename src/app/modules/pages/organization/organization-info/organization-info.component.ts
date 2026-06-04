import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    OnChanges,
    SimpleChanges,
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
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { environment } from 'environments/environment';

// Services
import { CreateOrganizationInfoService } from 'app/core/services/organization/organization-info/create-organization-info.service';
import { UpdateOrganizationInfoService } from 'app/core/services/organization/organization-info/update-organization-info.service';
import { GetOrganizationInfoService } from 'app/core/services/organization/organization-info/get-organization-info.service';
import { DeleteOrganizationInfoService } from 'app/core/services/organization/organization-info/delete-organization-info.service';
import {
    FOUNDED_YEAR_MIN,
    foundedYearSelectOptions,
    foundedYearToSelectValue,
} from 'app/core/utilities/founded-year-options';
import {
    normalizeZipForSave,
    US_ZIP_PATTERN,
    usZipFormValidators,
    zipFromApiForForm,
} from 'app/core/utilities/us-zip';

@Component({
    standalone: false,
    selector: 'app-organization-info',
    templateUrl: './organization-info.component.html',
    styleUrls: ['./organization-info.component.scss'],
})
export class OrganizationInfoComponent implements OnInit, OnDestroy, OnChanges {
    @Input()
    org: any;
    @Output() refreshOrg = new EventEmitter<boolean>();
    @Input()
    isDirector: any;
    @Input()
    inOrg: any; //used for director

    // multiple form
    public mode: 'view' | 'edit' = 'view';

    apiUrl = environment.apiUrl;

    orgID: any;

    orgInfo: any;

    orgInfoCreated: boolean = false;

    isReadOnly: boolean = true;

    loaded = false;

    showMessage = false;

    message: any;

    canSave = true;

    editing = false;
    editingLegalName: boolean = false;

    directorEditing = false;

    private formMessageSub?: Subscription;

    private orgInfoSaveInflight = 0;
    orgInfoSaving = false;
    orgInfoSavedFlash = false;
    private orgInfoSavedTimer: ReturnType<typeof setTimeout> | null = null;

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
        private _cdr: ChangeDetectorRef,
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
            yearFounded: new FormControl<number | null>(null, Validators.required),
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

        this.defaultValues();

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

    /** Years for year-founded `<mat-select>`s (includes current stored year if outside default range). */
    get foundedYearOptions(): number[] {
        return foundedYearSelectOptions(
            new Date().getFullYear(),
            FOUNDED_YEAR_MIN,
            foundedYearToSelectValue(this.orgObj?.yearFounded),
        );
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
            zip: '',
            website: '',
        };
    }

    private num(v: unknown, fallback = 0): number {
        if (v === '' || v === null || v === undefined) {
            return fallback;
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    private wireFormMessageClear(): void {
        this.formMessageSub?.unsubscribe();
        this.formMessageSub = this.groupedForm.valueChanges.subscribe(() => {
            this.showMessage = false;
        });
    }

    ngOnInit(): void {
        this.orgID = this.org._id;
        if (!this.orgInfo && !this.hydrateFromParentOrg()) {
            this.getOrganizationInfo();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['org']?.currentValue) {
            return;
        }
        this.orgID = this.org._id;
        if (this.hydrateFromParentOrg()) {
            return;
        }
        if (!changes['org'].firstChange) {
            this.getOrganizationInfo();
        }
    }

    ngOnDestroy(): void {
        this.formMessageSub?.unsubscribe();
        this.clearOrgInfoSavedTimer();
    }

    private clearOrgInfoSavedTimer(): void {
        if (this.orgInfoSavedTimer !== null) {
            clearTimeout(this.orgInfoSavedTimer);
            this.orgInfoSavedTimer = null;
        }
    }

    private beginOrgInfoSave(): void {
        this.orgInfoSaveInflight++;
        this.orgInfoSaving = true;
        this._cdr.markForCheck();
    }

    private endOrgInfoSave(): void {
        this.orgInfoSaveInflight = Math.max(0, this.orgInfoSaveInflight - 1);
        this.orgInfoSaving = this.orgInfoSaveInflight > 0;
        this._cdr.markForCheck();
    }

    private flashOrgInfoSaved(): void {
        this.clearOrgInfoSavedTimer();
        this.orgInfoSavedFlash = true;
        this._cdr.markForCheck();
        this.orgInfoSavedTimer = setTimeout(() => {
            this.orgInfoSavedFlash = false;
            this.orgInfoSavedTimer = null;
            this._cdr.markForCheck();
        }, 2000);
    }

    /**
     * Parent GET /organization already uses .populate('info'). Use it when present so the
     * profile renders even if the follow-up GET /organization-info call fails or is redundant.
     */
    private isPopulatedOrganizationInfo(info: unknown): boolean {
        return (
            info != null &&
            typeof info === 'object' &&
            ('legalName' in info || 'organizationInfoID' in info)
        );
    }

    private hydrateFromParentOrg(): boolean {
        const info = this.org?.info;
        if (!this.isPopulatedOrganizationInfo(info)) {
            return false;
        }
        this.orgInfo = info;
        this.setFields();
        return true;
    }

    getOrganizationInfo(): void {
        this.getOrganizationInfoService
            .getOrgInfobyOrgID(this.orgID)
            .subscribe({
                next: (orgInfo) => {
                    if (orgInfo) {
                        this.orgInfo = orgInfo;
                        this.setFields();
                    } else {
                        // No row yet: build defaults, attach org, then persist. setFields() must run
                        // after this.orgInfo is set so the template and validators see a stable record.
                        this.defaultValues();
                        this.orgInfo = {
                            ...this.orgObj,
                            organization: this.org._id,
                        };
                        this.setFields();
                        this.createOrganizationInfo(this.orgInfo);
                    }
                },
                error: () => {
                    if (this.hydrateFromParentOrg()) {
                        return;
                    }
                    this.defaultValues();
                    this.orgInfo = {
                        ...this.orgObj,
                        organization: this.org._id,
                    };
                    this.setFields();
                },
            });
    }

    createOrganizationInfo(body): void {
        this.createOrganizationInfoService
            .createOrganizationInfo(body)
            .subscribe(
                (result) => {
                    this.orgInfo = result.result;
                    this.setFields();
                },
                () => {}
            );
    }

    deleteOrganizationInfo(): void {
        this.deleteOrganizationInfoService
            .deleteOrgInfobyOrgInfoID(this.orgInfo._id)
            .subscribe((result) => {
                return result;
            });
    }

    setFields(): void {
        if (this.orgInfo) {
            const i = this.orgInfo;
            this.orgObj = {
                legalName: i.legalName ?? '',
                yearFounded: foundedYearToSelectValue(i.yearFounded) ?? 0,
                currentOperatingBudget: i.currentOperatingBudget ?? 0,
                director: i.director ?? '',
                phone: i.phone ?? '',
                contactPerson: i.contactPerson ?? '',
                contactPersonTitle: i.contactPersonTitle ?? '',
                contactPersonPhoneNumber: i.contactPersonPhoneNumber ?? '',
                email: i.email ?? '',
                address: i.address ?? '',
                city: i.city ?? '',
                state: i.state ?? '',
                zip: zipFromApiForForm(i.zip),
                website: i.website ?? '',
            };
        } else {
            this.defaultValues();
        }

        this.initGroupedForm();
    }

    //when toggling the full form
    resetFormValues(): void {
        const o = this.orgObj;
        this.formOrganization.setValue({
            legalName: o.legalName,
            yearFounded: o.yearFounded,
            currentOperatingBudget: o.currentOperatingBudget,
            director: o.director,
            phone: o.phone,
        });

        this.formContactPerson.setValue({
            contactPersonPhoneNumber: o.contactPersonPhoneNumber,
            contactPersonTitle: o.contactPersonTitle,
            contactPerson: o.contactPerson,
            email: o.email,
        });

        this.websiteFormControl.setValue(o.website);
        this.emailFormControl.setValue(o.email);
        this.addressFormControl.setValue(o.address);
        this.cityFormControl.setValue(o.city);
        this.stateFormControl.setValue(o.state);
        this.zipFormControl.setValue(zipFromApiForForm(o.zip));

        this.initGroupedForm();
    }

    edit(): void {
        const o = this.orgObj;
        this.formOrganization.setValue({
            legalName: o.legalName,
            yearFounded: o.yearFounded,
            currentOperatingBudget: o.currentOperatingBudget,
            director: o.director,
            phone: o.phone,
        });

        this.formContactPerson.setValue({
            contactPersonPhoneNumber: o.contactPersonPhoneNumber,
            contactPersonTitle: o.contactPersonTitle,
            contactPerson: o.contactPerson,
            email: o.email,
        });

        this.websiteFormControl.setValue(o.website);
        this.emailFormControl.setValue(o.email);
        this.addressFormControl.setValue(o.address);
        this.cityFormControl.setValue(o.city);
        this.stateFormControl.setValue(o.state);
        this.zipFormControl.setValue(zipFromApiForForm(o.zip));

        this.editing = true;
    }

    save(): void {
        this.editing = false;

        const v = this.groupedForm.getRawValue();
        const body = {
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
            organization: this.orgID,
        };

        if (this.orgInfo) {
            this.deleteOrganizationInfoService
                .deleteOrgInfobyOrgInfoID(this.orgInfo._id)
                .subscribe(() => {
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

    receiveChildData(data): void {
    }

    editLegalName(): void {
        this.editingLegalName = true;

        // //check for change
        // this.isReadOnly = !this.isReadOnly;
    }

    //new stuff

    initGroupedForm(): void {
        const o = this.orgObj;
        this.groupedForm = new FormGroup({
            legalName: new FormControl(o.legalName),
            yearFounded: new FormControl(foundedYearToSelectValue(o.yearFounded), [
                Validators.required,
                Validators.min(1),
            ]),
            currentOperatingBudget: new FormControl(
                o.currentOperatingBudget,
                [Validators.required, Validators.min(1)]
            ),
            director: new FormControl(o.director),
            phone: new FormControl(o.phone),
            contactPerson: new FormControl(o.contactPerson),
            contactPersonTitle: new FormControl(o.contactPersonTitle),
            contactPersonPhoneNumber: new FormControl(
                o.contactPersonPhoneNumber
            ),
            email: new FormControl(o.email),
            address: new FormControl(o.address),
            city: new FormControl(o.city),
            state: new FormControl(o.state),
            zip: new FormControl(zipFromApiForForm(o.zip), usZipFormValidators()),
            website: new FormControl(o.website),
        });

        this.initFormControls();
        this.wireFormMessageClear();
    }

    initFormControls(): void {
        const o = this.orgObj;
        this.legalNameControl = new FormControl(o.legalName);
        this.yearFoundedControl = new FormControl(foundedYearToSelectValue(o.yearFounded));
        this.currentOperatingBudgetControl = new FormControl(
            o.currentOperatingBudget
        );
        this.directorControl = new FormControl(o.director);
        this.phoneControl = new FormControl(o.phone);
        this.contactPersonControl = new FormControl(o.contactPerson);
        this.contactPersonTitleControl = new FormControl(
            o.contactPersonTitle
        );
        this.contactPersonPhoneNumberControl = new FormControl(
            o.contactPersonPhoneNumber
        );
        this.emailControl = new FormControl(o.email);
        this.addressControl = new FormControl(o.address);
        this.cityControl = new FormControl(o.city);
        this.stateControl = new FormControl(o.state);
        this.zipControl = new FormControl(zipFromApiForForm(o.zip), usZipFormValidators());
        this.websiteControl = new FormControl(o.website);
    }

    //sets the fields to the updated value
    //then calls the save single field function to call the database
    updateSingleField(prop: any, control: any): void {
        const c = this[control] as FormControl;
        const yearFoundedBlank =
            prop === 'yearFounded' &&
            (c.value === '' ||
                c.value === null ||
                c.value === undefined ||
                !Number.isFinite(Number(c.value)) ||
                Number(c.value) < 1);
        const zipBlank =
            prop === 'zip' &&
            (c.value === '' ||
                c.value === null ||
                c.value === undefined ||
                String(c.value).trim() === '');
        if (yearFoundedBlank || zipBlank || c.value === '' || c.value === null) {
            const reset =
                prop === 'yearFounded'
                    ? foundedYearToSelectValue(this.orgObj[prop])
                    : prop === 'zip'
                      ? zipFromApiForForm(this.orgObj[prop])
                      : this.orgObj[prop];
            c.setValue(reset);

            this.checkInvalidProp(prop, true);

            setTimeout(() => {
                this.checkInvalidProp(prop, false);
            }, 2000);
        } else {
            let val: any = c.value;
            if (prop === 'zip') {
                val = normalizeZipForSave(c.value);
                if (!US_ZIP_PATTERN.test(val)) {
                    c.setValue(zipFromApiForForm(this.orgObj[prop]));
                    this.checkInvalidProp(prop, true);
                    setTimeout(() => {
                        this.checkInvalidProp(prop, false);
                    }, 2000);
                    return;
                }
            } else if (prop === 'yearFounded' || prop === 'currentOperatingBudget') {
                val = this.num(val);
            }
            this.orgObj[prop] = val;
            this.saveSingleField({ [prop]: val });
        }
    }

    checkInvalidProp(prop: string, flag: boolean): void {
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
        const body = change;
        this.updateOrganizationInfo(body);
    }

    //calls the updateOrganizationService
    updateOrganizationInfo(body: any): void {
        this.beginOrgInfoSave();
        this.updateOrganizationInfoService
            .updateOrganizationInfo(this.orgInfo.organizationInfoID, body)
            .pipe(finalize(() => this.endOrgInfoSave()))
            .subscribe({
                next: (result) => {
                    this.orgInfo = result.info;
                    this.refreshOrg.emit(true);
                    this.resetFormValues();
                    this.flashOrgInfoSaved();
                },
                error: () => {},
            });
    }

    cancelSingleField(prop: string, control: any): void {
        const raw = this.orgObj[prop];
        const v =
            prop === 'yearFounded'
                ? foundedYearToSelectValue(raw)
                : prop === 'zip'
                  ? zipFromApiForForm(raw)
                  : raw;
        (this[control] as AbstractControl).setValue(v);
    }

    updateGroupedEdition(): void {
        const v = this.groupedForm.getRawValue();
        const payload = {
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
            organization: this.orgID,
        };

        this.updateOrganizationInfo(payload);
    }

    cancelGroupedEdition(): void {
        // this.groupedForm.setValue(this.orgObj);

        //reset values
        this.setFields();
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        this.mode = mode;

        this.resetFormValues();

        this.checkEditing(mode);
    }


    handleInlineEnter(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'TEXTAREA') {
            return;
        }
        if (this.mode !== 'edit' || !this.groupedForm?.valid || !this.orgInfo?.organizationInfoID) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.updateGroupedEdition();
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
