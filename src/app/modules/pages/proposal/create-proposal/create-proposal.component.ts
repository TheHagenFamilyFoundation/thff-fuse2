import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-create-proposal',
    templateUrl: './create-proposal.component.html',
    styleUrls: ['./create-proposal.component.scss'],
})
export class CreateProposalComponent implements OnInit, OnDestroy {
    org: any;

    // Form field values (synced from form for template char counts)
    projectTitle = '';
    purpose = '';
    goals = '';
    narrative = '';
    timeTable = '';
    amountRequested: number = 0;
    itemizedBudget = '';
    totalProjectCost: number = 0;

    showMessage = false;
    message = '';

    // Draft state
    draftSaved = false;
    hasDraft = false;

    user: any;
    userId: any;
    userEmail: string;

    groupedForm: FormGroup;

    readonly totalFields = 8;

    private _destroy$ = new Subject<void>();

    constructor(
        private proposalService: ProposalService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.initGroupedForm();
    }

    ngOnInit(): void {
        this.getUser();

        this.route.queryParams.subscribe((query) => {
            this.org = query.org;
            this.loadDraft();
        });

        // Immediate sync for character counts and clearing messages
        this.groupedForm.valueChanges.pipe(
            takeUntil(this._destroy$)
        ).subscribe((values) => {
            this.syncProperties(values);
            this.showMessage = false;
        });

        // Debounced auto-save
        this.groupedForm.valueChanges.pipe(
            debounceTime(1000),
            takeUntil(this._destroy$)
        ).subscribe(() => {
            this.saveDraft();
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    get completedFields(): number {
        if (!this.groupedForm) { return 0; }
        return Object.keys(this.groupedForm.controls)
            .filter(key => this.groupedForm.get(key).valid).length;
    }

    private get draftKey(): string {
        return `proposal-draft-${this.org || 'new'}`;
    }

    private syncProperties(values: any): void {
        this.projectTitle = values.projectTitle || '';
        this.purpose = values.purpose || '';
        this.goals = values.goals || '';
        this.narrative = values.narrative || '';
        this.timeTable = values.timeTable || '';
        this.amountRequested = values.amountRequested || 0;
        this.itemizedBudget = values.itemizedBudget || '';
        this.totalProjectCost = values.totalProjectCost || 0;
    }

    loadDraft(): void {
        const saved = localStorage.getItem(this.draftKey);
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                this.groupedForm.patchValue(draft, { emitEvent: false });
                this.syncProperties(draft);
                this.hasDraft = true;
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }

    saveDraft(): void {
        localStorage.setItem(this.draftKey, JSON.stringify(this.groupedForm.value));
        this.hasDraft = true;
        this.draftSaved = true;
        setTimeout(() => this.draftSaved = false, 2000);
    }

    clearDraft(): void {
        localStorage.removeItem(this.draftKey);
        this.hasDraft = false;
        this.groupedForm.reset({
            projectTitle: '',
            purpose: '',
            goals: '',
            narrative: '',
            timeTable: '',
            amountRequested: 0,
            itemizedBudget: '',
            totalProjectCost: 0,
        });
    }

    initGroupedForm(): void {
        this.groupedForm = new FormGroup({
            projectTitle: new FormControl('', [Validators.required]),
            purpose: new FormControl('', [Validators.required]),
            goals: new FormControl('', [Validators.required]),
            narrative: new FormControl('', [Validators.required]),
            timeTable: new FormControl('', [Validators.required]),
            amountRequested: new FormControl(0, [Validators.required, Validators.min(1)]),
            itemizedBudget: new FormControl('', [Validators.required]),
            totalProjectCost: new FormControl(0, [Validators.required, Validators.min(1)]),
        });
    }

    //retrieve the user from localStorage
    getUser(): void {
        if (localStorage.getItem('currentUser')) {
            this.user = JSON.parse(localStorage.getItem('currentUser'));
            this.userId = this.user.id;
            this.userEmail = this.user.email;
        } else {
            this.router.navigate(['/sign-in']);
        }
    }

    cancel(): void {
        this.router.navigate(['/welcome']);
    }

    private getActiveReferralCode(): string | undefined {
        const stored = localStorage.getItem('referralCode');
        if (!stored) { return undefined; }

        try {
            const refData = JSON.parse(stored);
            if (refData.year === new Date().getFullYear()) {
                return refData.code;
            }
            // Expired (different year), clean up
            localStorage.removeItem('referralCode');
            return undefined;
        } catch {
            // Legacy format (plain string) — use it but don't persist
            localStorage.removeItem('referralCode');
            return stored;
        }
    }

    createProposal(): void {
        this.groupedForm.markAllAsTouched();

        if (!this.groupedForm.valid) {
            return;
        }

        const proposalObj = this.groupedForm.value;
        const referralCode = this.getActiveReferralCode();

        this.proposalService.createProposal(proposalObj, this.org, referralCode).subscribe(
            (result) => {
                this.clearDraft();
                this.router.navigate([`/pages/proposal/${result.proposalID}`]);
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
