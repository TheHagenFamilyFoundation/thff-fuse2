import { TestBed } from '@angular/core/testing';

import { SubmissionYearsService } from './submission-years.service';

describe('SubmissionYearsService', () => {
  let service: SubmissionYearsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubmissionYearsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
