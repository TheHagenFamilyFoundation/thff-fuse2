import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionYearsComponent } from './submission-years.component';

describe('SubmissionYearsComponent', () => {
  let component: SubmissionYearsComponent;
  let fixture: ComponentFixture<SubmissionYearsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmissionYearsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionYearsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
