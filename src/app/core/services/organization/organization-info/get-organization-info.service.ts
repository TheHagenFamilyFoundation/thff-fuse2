import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class GetOrganizationInfoService {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('GetOrganizationInfoService - this.apiUrl', this.apiUrl);
    }

    console.log('GetOrganizationInfoService - this.apiUrl', this.apiUrl);
  }

  getOrgInfobyOrgID(orgID: string): Observable<any> {
    console.log('getOrgInfobyOrgID');

    const urlString = `${this.apiUrl}/organizationInfo?organization=${orgID}`;

    return this.http.get(urlString);
  }

  getOrgInfobyID(orgInfoID: string): Observable<any> {
    const urlString = `${this.apiUrl}/organizationInfo?organizationID=${orgInfoID}`;

    return this.http.get(urlString);
  }
}
