import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalSummaryComponent } from './proposal-summary.component';

describe('ProposalSummaryComponent', () => {
  let component: ProposalSummaryComponent;
  let fixture: ComponentFixture<ProposalSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProposalSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProposalSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
