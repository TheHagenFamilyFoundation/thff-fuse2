import { TestBed, inject } from '@angular/core/testing';

import { UpdateOrganizationInfoService } from './update-organization-info.service';

describe('UpdateOrganizationInfoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UpdateOrganizationInfoService]
    });
  });

  it('should be created', inject([UpdateOrganizationInfoService], (service: UpdateOrganizationInfoService) => {
    expect(service).toBeTruthy();
  }));
});
