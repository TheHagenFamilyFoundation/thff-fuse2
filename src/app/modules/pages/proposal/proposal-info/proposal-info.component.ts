import {
    ChangeDetectorRef,
    Component,
    OnChanges,
    OnDestroy,
    OnInit,
    EventEmitter,
    Output,
    Input,
    SimpleChanges,
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

@Component({
    standalone: false,
    selector: 'app-proposal-info',
    templateUrl: './proposal-info.component.html',
    styleUrls: ['./proposal-info.component.scss'],
})
export class ProposalInfoComponent implements OnInit, OnDestroy, OnChanges {

    @Output() refreshProp = new EventEmitter<boolean>();
    @Input()
    isDirector: any;
    @Input()
    inOrg: any; //used for director

    proposalID: string; //generated ID
    propID: string; //mongo id
    proposal: any; // the Proposal object
    orgID: string;
    // multiple form
    public mode: 'view' | 'edit' = 'view';

    apiUrl = environment.apiUrl;

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

    directorEditing = false;

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
        private _cdr: ChangeDetectorRef,
        fb: FormBuilder
    ) {
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
    }

    defaultValues(): void {
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
        this.route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe((pm) => {
            const id = pm.get('id');
            if (!id) {
                return;
            }
            this.proposalID = id;
            this.getProposal(id);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Parent sets `inOrg` after org loads; view block *ngIf="directorEditing || inOrg" must repaint
        if (changes['inOrg'] || changes['isDirector']) {
            this._cdr.detectChanges();
        }
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
        // query database for that proposal

        this._proposalService
            .getProposalByID(proposalID)
            .subscribe((proposal) => {
                if (proposal) {
                    this.proposal = proposal;
                    this.propID = this.proposal._id; //mongo id
                    this.setFields();
                    this.loaded = true;
                    this._cdr.detectChanges();
                    Promise.resolve().then(() => this._cdr.detectChanges());
                } else {
                    //send user back to welcome
                    this._router.navigate(['/welcome']);
                }
            },
                () => {});
    }

    // refreshProposal(): void {
    //     this.getProposal(this.proposalID); //fetch the proposal again
    // }

    setFields(): void {
        if (this.proposal) {
            if (this.proposal.projectTitle) {
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
        this._cdr.detectChanges();
    }

    //when toggling the full form
    resetFormValues(): void {
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
        if (this[control].value === '') {
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
        const body = change;

        this.updateProposal(body);
    }

    cancelSingleField(prop: string, control: any): void {
        (this[control] as AbstractControl).setValue(this[prop]);
    }

    //calls the updateOrganizationService
    updateProposal(body: any): void {
        this._proposalService.updateProposal(this.propID, body).subscribe(
            (result) => {
                this.proposal = result.proposal;

                this.refreshProp.emit(true);
                this.resetFormValues();
            },
            () => {}
        );
    }

    updateGroupedEdition(): void {
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

        this._proposalService
            .updateProposal(this.propID, this.propObj)
            .subscribe(
                (result) => {
                    this.propObj = result.proposal;

                    this.refreshProp.emit(true);
                    this.resetFormValues();
                },
                () => {}
            );
    }

    cancelGroupedEdition(): void {
        //reset values
        this.setFields();
    }

    mainCancel(): void {
        this.editing = false;

        this.getProposal(this.proposalID);
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        this.mode = mode;

        this.resetFormValues();

        if (mode === 'view') {
            this.editing = false;
        } else {
            this.editing = true;
        }
    }

    projectTitleChange(): void {
        this.showMessage = false;
    }

    purposeChange(): void {
        this.showMessage = false;
    }

    goalsChange(): void {
        this.showMessage = false;
    }

    narrativeChange(): void {
        this.showMessage = false;
    }

    timeTableChange(): void {
        this.showMessage = false;
    }

    amountRequestedChange(): void {
        this.showMessage = false;
    }

    totalProjectCostChange(): void {
        this.showMessage = false;
    }

    itemizedBudgetChange(): void {
        this.showMessage = false;
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
