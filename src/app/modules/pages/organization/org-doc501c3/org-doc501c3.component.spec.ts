import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgDoc501c3Component } from './org-doc501c3.component';

describe('OrgDoc501c3Component', () => {
  let component: OrgDoc501c3Component;
  let fixture: ComponentFixture<OrgDoc501c3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrgDoc501c3Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgDoc501c3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
