import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ProposalsComponent } from './proposals.component';
import { ProposalService } from 'app/core/services/proposal/proposal.service';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

describe('ProposalsComponent', () => {
    let component: ProposalsComponent;
    let fixture: ComponentFixture<ProposalsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProposalsComponent],
            imports: [RouterTestingModule],
            providers: [
                {
                    provide: ProposalService,
                    useValue: {
                        getMyProposals: () => of([]),
                        deleteMyProposal: () => of(undefined),
                    },
                },
                {
                    provide: SubmissionYearsService,
                    useValue: {
                        getAllSubmissionYears: () => of([{ year: new Date().getFullYear() }]),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProposalsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
