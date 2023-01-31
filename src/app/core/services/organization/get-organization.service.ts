import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable()
export class GetOrganizationService {
  apiUrl: string;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('GetOrganizationService - this.apiUrl', this.apiUrl);
    }

    console.log('GetOrganizationService - this.apiUrl', this.apiUrl);
  }

  // get Organization by director
  getOrgbyDirector(username: string): Observable<any> {
    const urlString = `${this.apiUrl}/organization?director=${username}`;

    return this.http.get(urlString);
  }

  getOrgbyName(name: string): Observable<any> {
    const urlString = `${this.apiUrl}/organization?name=${name}`;

    return this.http.get(urlString);
  }

  getOrgbyID(orgID: string): Observable<any> {
    const urlString = `${this.apiUrl}/organization?organizationID=${orgID}`;

    return this.http.get(urlString);
  }

  getAllOrgs(): Observable<any> {
    const urlString = `${this.apiUrl}/organization?limit=1000`;

    return this.http.get(urlString);
  }
}
