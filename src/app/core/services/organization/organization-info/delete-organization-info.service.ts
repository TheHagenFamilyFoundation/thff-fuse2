import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class DeleteOrganizationInfoService {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('DeleteOrganizationInfoService - this.apiUrl', this.apiUrl);
    }

    console.log('DeleteOrganizationInfoService - this.apiUrl', this.apiUrl);
  }

  deleteOrgInfobyOrgInfoID(orgInfoID: string): Observable<any> {
    console.log('deleteOrgInfobyOrgID');

    const urlString = `${this.apiUrl}/organizationInfo/${orgInfoID}`;

    return this.http.delete(urlString);
  }
}
