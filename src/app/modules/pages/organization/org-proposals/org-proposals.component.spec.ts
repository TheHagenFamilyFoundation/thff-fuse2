import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgProposalsComponent } from './org-proposals.component';

describe('OrgProposalsComponent', () => {
  let component: OrgProposalsComponent;
  let fixture: ComponentFixture<OrgProposalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrgProposalsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgProposalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
