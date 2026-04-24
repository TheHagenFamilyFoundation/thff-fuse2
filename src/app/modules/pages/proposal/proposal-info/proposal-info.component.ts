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
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { ProposalService } from 'app/core/services/proposal/proposal.service';

@Component({
    standalone: false,
    selector: 'app-proposal-info',
    templateUrl: './proposal-info.component.html',
    styleUrls: ['./proposal-info.component.scss'],
})
export class ProposalInfoComponent implements OnInit, OnDestroy, OnChanges {
    @Output() refreshProp = new EventEmitter<boolean>();
    @Input() isDirector: any;
    @Input() inOrg: any;

    proposalID: string;
    propID: string;
    proposal: any;
    orgID: string;

    public mode: 'view' | 'edit' = 'view';

    apiUrl = environment.apiUrl;

    public groupedForm: FormGroup;

    public propObj: any;

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

    public invalidInputProjectTitle = false;
    public invalidInputPurpose = false;
    public invalidInputGoals = false;
    public invalidInputNarrative = false;
    public invalidInputTimeTable = false;
    public invalidInputAmountRequested = false;
    public invalidInputTotalProjectCost = false;
    public invalidInputItemizedBudget = false;

    private readonly _unsubscribeAll = new Subject<void>();
    private formMessageSub?: Subscription;

    constructor(
        private _proposalService: ProposalService,
        private _router: Router,
        private route: ActivatedRoute,
        private _cdr: ChangeDetectorRef
    ) {}

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
        if (changes['inOrg'] || changes['isDirector']) {
            this._cdr.detectChanges();
        }
    }

    ngOnDestroy(): void {
        this.formMessageSub?.unsubscribe();
        this._unsubscribeAll.next(undefined);
        this._unsubscribeAll.complete();
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

    getProposal(proposalID: string): void {
        this._proposalService.getProposalByID(proposalID).subscribe(
            (proposal) => {
                if (proposal) {
                    this.proposal = proposal;
                    this.propID = this.proposal._id;
                    const org = this.proposal.organization;
                    this.orgID =
                        typeof org === 'object' && org
                            ? org._id
                            : org;
                    this.setFields();
                    this.loaded = true;
                    this._cdr.detectChanges();
                    Promise.resolve().then(() => this._cdr.detectChanges());
                } else {
                    this._router.navigate(['/welcome']);
                }
            },
            () => {}
        );
    }

    setFields(): void {
        if (this.proposal) {
            this.propObj = {
                projectTitle: this.proposal.projectTitle ?? '',
                purpose: this.proposal.purpose ?? '',
                goals: this.proposal.goals ?? '',
                narrative: this.proposal.narrative ?? '',
                timeTable: this.proposal.timeTable ?? '',
                amountRequested: this.proposal.amountRequested ?? 0,
                totalProjectCost: this.proposal.totalProjectCost ?? 0,
                itemizedBudget: this.proposal.itemizedBudget ?? '',
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

    resetFormValues(): void {
        this.initGroupedForm();
    }

    initGroupedForm(): void {
        const req = Validators.required;
        const p = this.propObj;

        this.groupedForm = new FormGroup({
            projectTitle: new FormControl(p.projectTitle, req),
            purpose: new FormControl(p.purpose, req),
            goals: new FormControl(p.goals, req),
            narrative: new FormControl(p.narrative, req),
            timeTable: new FormControl(p.timeTable, req),
            amountRequested: new FormControl(p.amountRequested, [req, Validators.min(1)]),
            totalProjectCost: new FormControl(p.totalProjectCost, [req, Validators.min(1)]),
            itemizedBudget: new FormControl(p.itemizedBudget, req),
        });

        this.initFormControls();
        this.wireFormMessageClear();
    }

    initFormControls(): void {
        const p = this.propObj;
        this.projectTitleControl = new FormControl(p.projectTitle);
        this.purposeControl = new FormControl(p.purpose);
        this.goalsControl = new FormControl(p.goals);
        this.narrativeControl = new FormControl(p.narrative);
        this.timeTableControl = new FormControl(p.timeTable);
        this.amountRequestedControl = new FormControl(p.amountRequested);
        this.totalProjectCostControl = new FormControl(p.totalProjectCost);
        this.itemizedBudgetControl = new FormControl(p.itemizedBudget);
    }

    updateSingleField(prop: string, control: string): void {
        const c = this[control] as FormControl;
        if (c.value === '' || c.value === null) {
            c.setValue(this.propObj[prop]);
            this.checkInvalidProp(prop, true);
            setTimeout(() => this.checkInvalidProp(prop, false), 2000);
        } else {
            let val: any = c.value;
            if (prop === 'amountRequested' || prop === 'totalProjectCost') {
                val = this.num(val);
            }
            this.propObj[prop] = val;
            this.saveSingleField({ [prop]: val });
        }
    }

    checkInvalidProp(prop: string, flag: boolean): void {
        switch (prop) {
            case 'projectTitle':
                this.invalidInputProjectTitle = flag;
                break;
            case 'purpose':
                this.invalidInputPurpose = flag;
                break;
            case 'goals':
                this.invalidInputGoals = flag;
                break;
            case 'narrative':
                this.invalidInputNarrative = flag;
                break;
            case 'timeTable':
                this.invalidInputTimeTable = flag;
                break;
            case 'amountRequested':
                this.invalidInputAmountRequested = flag;
                break;
            case 'totalProjectCost':
                this.invalidInputTotalProjectCost = flag;
                break;
            case 'itemizedBudget':
                this.invalidInputItemizedBudget = flag;
                break;
            default:
                console.error('invalid switch prop');
        }
    }

    saveSingleField(change: Record<string, unknown>): void {
        this.updateProposal(change);
    }

    cancelSingleField(prop: string, control: string): void {
        (this[control] as AbstractControl).setValue(this.propObj[prop]);
    }

    updateProposal(body: Record<string, unknown>): void {
        this._proposalService.updateProposal(this.propID, body).subscribe(
            (result) => {
                this.proposal = result.proposal ?? result;
                this.setFields();
                this.refreshProp.emit(true);
            },
            () => {}
        );
    }

    updateGroupedEdition(): void {
        const v = this.groupedForm.getRawValue();
        const payload = {
            projectTitle: v.projectTitle ?? '',
            purpose: v.purpose ?? '',
            goals: v.goals ?? '',
            narrative: v.narrative ?? '',
            timeTable: v.timeTable ?? '',
            amountRequested: this.num(v.amountRequested),
            totalProjectCost: this.num(v.totalProjectCost),
            itemizedBudget: v.itemizedBudget ?? '',
            organization: this.orgID,
        };

        this._proposalService.updateProposal(this.propID, payload).subscribe(
            (result) => {
                this.proposal = result.proposal ?? result;
                this.setFields();
                this.refreshProp.emit(true);
            },
            () => {}
        );
    }

    cancelGroupedEdition(): void {
        this.setFields();
    }

    mainCancel(): void {
        this.editing = false;
        this.getProposal(this.proposalID);
    }

    handleModeChange(mode: 'view' | 'edit'): void {
        this.mode = mode;
        this.resetFormValues();
        this.editing = mode === 'edit';
    }

    toggleDirectorEdit(): void {
        this.directorEditing = !this.directorEditing;
        this.mode = 'view';
        this.checkEditing(this.mode);
    }

    checkEditing(mode: string): void {
        this.editing = mode !== 'view';
    }
}
