import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
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
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { environment } from 'environments/environment';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'proposal',
    templateUrl: './proposal.component.html',
    styleUrls: ['./proposal.component.scss'],
})
export class ProposalComponent implements OnInit, OnDestroy {
    proposalID: string; //generated ID
    propID: string; //mongo id
    proposal: any; // the Proposal object
    orgID: string;
    // multiple form
    public mode: 'view' | 'edit' = 'view';

    apiUrl: string;

    projectTitle$ = new Subject<string>();
    purpose$ = new Subject<string>();
    goals$ = new Subject<string>();
    narrative$ = new Subject<string>();
    timeTable$ = new Subject<string>();
    amountRequested$ = new Subject<number>();
    totalProjectCost$ = new Subject<number>();
    itemizedBudget$ = new Subject<string>();

    projectTitle: string;
    purpose: string;
    goals: string;
    narrative: string;
    timeTable: string;
    amountRequested: number;
    totalProjectCost: number;
    itemizedBudget: string;

    formProposal: FormGroup;

    loaded = false;

    showMessage = false;

    message: any;

    canSave = true;

    editing = false;

    public projectTitleControl: FormControl;
    public purposeControl: FormControl;
    public goalsControl: FormControl;
    public narrativeControl: FormControl;
    public timeTableControl: FormControl;
    public amountRequestedControl: FormControl;
    public totalProjectCostControl: FormControl;
    public itemizedBudgetControl: FormControl;

    public groupedForm: FormGroup;

    public propObj: any;

    public invalidInputProjectTitle: boolean = false;
    public invalidInputPurpose: boolean = false;
    public invalidInputGoals: boolean = false;
    public invalidInputNarrative: boolean = false;
    public invalidInputTimeTable: boolean = false;
    public invalidInputAmountRequested: boolean = false;
    public invalidInputTotalProjectCost: boolean = false;
    public invalidInputItemizedBudget: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _proposalService: ProposalService,
        private _router: Router,
        private route: ActivatedRoute,
        public authService: AuthService,
        fb: FormBuilder
    ) {
        this.route.params.subscribe((params) => {
            console.log(params);
            this.proposalID = params.id;
        });

        this.projectTitle$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.projectTitle = term;
                this.projectTitleChange();
            });

        this.purpose$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.purpose = term;
                this.purposeChange();
            });
        this.goals$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.goals = term;
                this.goalsChange();
            });
        this.narrative$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.narrative = term;
                this.narrativeChange();
            });
        this.timeTable$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.timeTable = term;
                this.timeTableChange();
            });
        this.amountRequested$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.amountRequested = term;
                this.amountRequestedChange();
            });
        this.totalProjectCost$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.totalProjectCost = term;
                this.totalProjectCostChange();
            });
        this.itemizedBudget$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((term) => {
                this.itemizedBudget = term;
                this.itemizedBudgetChange();
            });

        this.defaultValues();

        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('ProposalComponent - this.apiUrl', this.apiUrl);
        }

        console.log('ProposalComponent - this.apiUrl', this.apiUrl);
    }

    defaultValues(): void {
        console.log('defaulting values');

        //main
        this.projectTitle = '';
        this.purpose = '';
        this.goals = '';
        this.narrative = '';
        this.timeTable = '';
        this.amountRequested = 0;
        this.totalProjectCost = 0;
        this.itemizedBudget = '';
    }

    ngOnInit(): void {
        console.log('proposal - proposalID', this.proposalID);

        this.getProposal(this.proposalID);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    getProposal(proposalID): void {
        console.log('check proposals');

        // query database for that proposal

        this._proposalService
            .getProposalByID(proposalID)
            .subscribe((proposal) => {
                if (proposal.length > 0) {
                    console.log('proposal component - proposal', proposal);

                    // [this.orgInfo] = orgInfo;

                    this.proposal = proposal[0];
                    this.propID = this.proposal.id; //mongo id
                    this.setFields();
                } else {
                    //send user back to welcome
                    this._router.navigate(['/welcome']);
                }
            });
    }

    // refreshProposal(): void {
    //     this.getProposal(this.proposalID); //fetch the proposal again
    // }

    getBackendURL(): void {
        console.log('proposal - environment', environment);
        if (environment.production) {
            console.log('environment is production');
            this.authService.initializeBackendURL().subscribe((backendUrl) => {
                console.log('proposal component - backendUrl', backendUrl.url);

                if (backendUrl) {
                    sessionStorage.setItem('backend_url', backendUrl.url);
                } else {
                    console.log(
                        'Can´t find the backend URL, using a failover value'
                    );
                    sessionStorage.setItem(
                        'backend_url',
                        'https://failover-url.com'
                    );
                }

                // this.API = backendUrl.url;
                // this.LoadedAPI = true;
            });
        }
    }

    setFields(): void {
        console.log('setting fields');

        if (this.proposal) {
            console.log('proposal object exists');

            if (this.proposal.projectTitle) {
                console.log(
                    'proposal - this.proposal.projectTitle',
                    this.proposal.projectTitle
                );
                this.projectTitle = this.proposal.projectTitle;
            }

            if (this.proposal.purpose) {
                this.purpose = this.proposal.purpose;
            }

            if (this.proposal.goals) {
                this.goals = this.proposal.goals;
            }

            if (this.proposal.narrative) {
                this.narrative = this.proposal.narrative;
            }

            if (this.proposal.timeTable) {
                this.timeTable = this.proposal.timeTable;
            }

            if (this.proposal.amountRequested) {
                this.amountRequested = this.proposal.amountRequested;
            }

            if (this.proposal.totalProjectCost) {
                this.totalProjectCost = this.proposal.totalProjectCost;
            }

            if (this.proposal.itemizedBudget) {
                this.itemizedBudget = this.proposal.itemizedBudget;
            }

            this.propObj = {
                projectTitle: this.projectTitle,
                purpose: this.purpose,
                goals: this.goals,
                narrative: this.narrative,
                timeTable: this.timeTable,
                amountRequested: this.amountRequested,
                totalProjectCost: this.totalProjectCost,
                itemizedBudget: this.itemizedBudget,
            };
        } else {
            console.log('default values');

            this.propObj = {
                projectTitle: '',
                purpose: '',
                goals: '',
                narrative: '',
                timeTable: '',
                amountRequested: 0,
                totalProjectCost: 0,
                itemizedBudget: '',
            };
        }

        this.initGroupedForm();
    }

    //when toggling the full form
    resetFormValues(): void {
        console.log('reseting form values');

        // this.formOrganization.setValue({
        //     legalName: this.legalName,
        //     yearFounded: this.yearFounded,
        //     currentOperatingBudget: this.currentOperatingBudget,
        //     director: this.director,
        //     phone: this.phone,
        // });

        // this.formContactPerson.setValue({
        //     contactPersonPhoneNumber: this.contactPersonPhoneNumber,
        //     contactPersonTitle: this.contactPersonTitle,
        //     contactPerson: this.contactPerson,
        //     email: this.email,
        // });

        // this.websiteFormControl.setValue(this.website);
        // this.emailFormControl.setValue(this.email);
        // this.addressFormControl.setValue(this.address);
        // this.cityFormControl.setValue(this.city);
        // this.stateFormControl.setValue(this.state);
        // this.zipFormControl.setValue(this.zip);

        // this.initFormControls();
        this.initGroupedForm();
    }

    initGroupedForm(): void {
        console.log('initializing grouped form');
        console.log('prop obj - projectTitle', this.propObj.projectTitle);

        this.groupedForm = new FormGroup({
            projectTitle: new FormControl(this.propObj.projectTitle),
            purpose: new FormControl(this.propObj.purpose),
            goals: new FormControl(this.propObj.goals),
            narrative: new FormControl(this.propObj.narrative),
            timeTable: new FormControl(this.propObj.timeTable),
            amountRequested: new FormControl(this.propObj.amountRequested, [
                Validators.required,
                Validators.min(1),
            ]),
            totalProjectCost: new FormControl(this.propObj.totalProjectCost, [
                Validators.required,
                Validators.min(1),
            ]),
            itemizedBudget: new FormControl(this.propObj.itemizedBudget),
        });

        this.initFormControls();
    }

    initFormControls(): void {
        console.log('initializing form controls');
        console.log('this.projectTitle', this.projectTitle);

        this.projectTitleControl = new FormControl(this.projectTitle);
        this.purposeControl = new FormControl(this.purpose);
        this.goalsControl = new FormControl(this.goals);
        this.narrativeControl = new FormControl(this.narrative);
        this.timeTableControl = new FormControl(this.timeTable);
        this.amountRequestedControl = new FormControl(this.amountRequested);
        this.totalProjectCostControl = new FormControl(this.totalProjectCost);
        this.itemizedBudgetControl = new FormControl(this.itemizedBudget);
    }

    //sets the fields to the updated value
    //then calls the save single field function to call the database
    updateSingleField(prop: any, control: any): void {
        console.log('prop', prop);
        console.log('control', control);
        console.log('proposal - updateSingleField', this[control].value);

        if (this[control].value === '') {
            console.log('blank value');
            //reset the value
            console.log('old value', this.propObj[prop]);
            this[control].value = this.propObj[prop];

            this.checkInvalidProp(prop, true);

            // this.invalidInputLegalName = true;
            setTimeout(() => {
                // this.invalidInputLegalName = false;
                this.checkInvalidProp(prop, false);
            }, 2000);
        } else {
            this[prop] = this[control].value;
            this.propObj[prop] = this[control].value;
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
            case 'projectTitle': {
                this.invalidInputProjectTitle = flag;
                break;
            }
            case 'purpose': {
                this.invalidInputPurpose = flag;
                break;
            }
            case 'goals': {
                this.invalidInputGoals = flag;
                break;
            }
            case 'narrative': {
                this.invalidInputNarrative = flag;
                break;
            }
            case 'timeTable': {
                this.invalidInputTimeTable = flag;
                break;
            }
            case 'amountRequested': {
                this.invalidInputAmountRequested = flag;
                break;
            }
            case 'totalProjectCost': {
                this.invalidInputTotalProjectCost = flag;
                break;
            }
            case 'itemizedBudget': {
                this.invalidInputItemizedBudget = flag;
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
        this.updateProposal(body);
    }

    cancelSingleField(prop: string, control: any): void {
        console.log('org info - cancelSingleField', this[control].value);
        (this[control] as AbstractControl).setValue(this[prop]);
    }

    //calls the updateOrganizationService
    updateProposal(body: any): void {
        console.log('updateProposal', body);

        this._proposalService.updateProposal(this.proposalID, body).subscribe(
            (result) => {
                console.log('Proposal updated', result);
                this.proposal = result;

                console.log(
                    'new this.orgInfo.organizationInfoID',
                    this.proposal.proposalID
                );

                // this.refreshProposal.emit(true);
                this.resetFormValues();
            },
            (err) => {
                console.log(err);
            }
        );
    }

    updateGroupedEdition(): void {
        console.log('change - this.projectTitle', this.projectTitle);

        console.log('old - this.propObj', this.propObj);

        // this.orgObj = this.groupedForm.value; //out of date
        this.propObj = {
            projectTitle: this.projectTitle, //changed
            purpose: this.purpose,
            goals: this.goals,
            narrative: this.narrative,
            timeTable: this.timeTable,
            amountRequested: this.amountRequested,
            totalProjectCost: this.totalProjectCost,
            itemizedBudget: this.itemizedBudget,
            organization: this.orgID,
        };

        console.log('new - this.propObj', this.propObj);

        this._proposalService
            .updateProposal(this.proposalID, this.propObj)
            .subscribe(
                (result) => {
                    console.log('Proposal updated', result);
                    this.propObj = result.info;

                    // this.refreshProp.emit(true);
                    this.resetFormValues();
                },
                (err) => {
                    console.log(err);
                }
            );
    }

    cancelGroupedEdition(): void {
        console.log('proposal - cancelGroupedEdition');
        // this.groupedForm.setValue(this.orgObj);

        //reset values
        this.setFields();
    }

    mainCancel(): void {
        this.editing = false;

        this.getProposal(this.proposalID);
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        console.log('proposal - toggle mode change', mode);
        this.mode = mode;

        this.resetFormValues();

        if (mode === 'view') {
            this.editing = false;
        } else {
            this.editing = true;
        }
    }

    projectTitleChange(): void {
        console.log('projectTitleChange');

        this.showMessage = false;
    }

    purposeChange(): void {
        console.log('purposeChange');

        this.showMessage = false;
    }

    goalsChange(): void {
        console.log('goalsChange');

        this.showMessage = false;
    }

    narrativeChange(): void {
        console.log('narrativeChange');

        this.showMessage = false;
    }

    timeTableChange(): void {
        console.log('timeTableChange');

        this.showMessage = false;
    }

    amountRequestedChange(): void {
        console.log('amountRequestedChange');

        this.showMessage = false;
    }

    totalProjectCostChange(): void {
        console.log('totalProjectCostChange');

        this.showMessage = false;
    }

    itemizedBudgetChange(): void {
        console.log('itemizedBudgetChange');

        this.showMessage = false;
    }
}
