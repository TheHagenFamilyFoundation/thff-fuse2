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
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-create-proposal',
  templateUrl: './create-proposal.component.html',
  styleUrls: ['./create-proposal.component.scss'],
})
export class CreateProposalComponent implements OnInit {
  apiUrl: string;

  //TODO: Type Organization id - mongo
  org: any;

  proposalObj: any;

  projectTitle$ = new Subject<string>();

  purpose$ = new Subject<string>();

  goals$ = new Subject<string>();

  narrative$ = new Subject<string>();

  timeTable$ = new Subject<string>();

  amountRequested$ = new Subject<string>();

  itemizedBudget$ = new Subject<string>();

  totalProjectCost$ = new Subject<string>();

  projectTitle: string;

  purpose: string;

  goals: string;

  narrative: string;

  timeTable: string;

  amountRequested: number;

  itemizedBudget: string;

  totalProjectCost: number;

  showMessage: boolean;

  user: any;

  // object
  userId: any;

  // string
  userEmail: string;

  message: string;

  public groupedForm: FormGroup;

  constructor(
    fb: FormBuilder,
    private proposalService: ProposalService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
        this.amountRequested = Number(term);
        this.amountRequestedChange();
      });

    this.itemizedBudget$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => {
        this.itemizedBudget = term;
        this.itemizedBudgetChange();
      });

    this.totalProjectCost$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => {
        this.totalProjectCost = Number(term);
        this.totalProjectCostChange();
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

    this.route.queryParams.subscribe((query) => {
      console.log('create-proposal - query', query);
      this.org = query.org
    });

  }

  //retrieve the user from localStorage
  getUser(): void {
    if (localStorage.getItem('currentUser')) {
      console.log(
        'create proposal - localStorage. currentUser',
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

  itemizedBudgetChange(): void {
    console.log('itemizedBudgetChange');

    this.showMessage = false;
  }

  totalProjectCostChange(): void {
    console.log('totalProjectCostChange');

    this.showMessage = false;
  }

  defaultValues(): void {
    console.log('default values');


    //proposal information object
    this.proposalObj = {
      projectTitle: '',
      purpose: '',
      goals: '',
      narrative: '',
      timeTable: '',
      amountRequested: 0,
      itemizedBudget: '',
      totalProjectCost: 0,
    };

    this.initGroupedForm();
  }

  initGroupedForm(): void {
    console.log('initializing grouped form');
    console.log('proposal obj - ', this.proposalObj.projectTitle);

    this.groupedForm = new FormGroup({
      projectTitle: new FormControl(this.proposalObj.projectTitle),
      purpose: new FormControl(this.proposalObj.purpose),
      goals: new FormControl(this.proposalObj.goals),
      narrative: new FormControl(this.proposalObj.narrative),
      timeTable: new FormControl(this.proposalObj.timeTable),
      amountRequested: new FormControl(this.proposalObj.amountRequested,
        [Validators.required, Validators.min(1)]
      ),
      itemizedBudget: new FormControl(this.proposalObj.itemizedBudget),
      totalProjectCost: new FormControl(this.proposalObj.totalProjectCost,
        [Validators.required, Validators.min(1)]
      ),
    });
  }

  cancel(): void {
    //route to main/home
    this.router.navigate(['/welcome']);
  }

  createProposal(): void {
    console.log('creating proposal');
    this.proposalObj = {
      projectTitle: this.projectTitle, //changed
      purpose: this.purpose,
      goals: this.goals,
      narrative: this.narrative,
      timeTable: this.timeTable,
      amountRequested: this.amountRequested,
      itemizedBudget: this.itemizedBudget,
      totalProjectCost: this.totalProjectCost,
      organization: this.org //mongo id
    };


    // call the service
    this.proposalService.createProposal(this.proposalObj).subscribe(
      (result) => {
        console.log('Proposal Info Created', result);
        this.router.navigate([
          `/pages/proposal/${result.proposalID}`,
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
