import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CreateOrganizationInfoService {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('CreateOrganizationInfoService - this.apiUrl', this.apiUrl);
    }

    console.log('CreateOrganizationInfoService - this.apiUrl', this.apiUrl);
  }

  createOrganizationInfo(body): Observable<any> {
    console.log('createOrganizationInfo');

    const urlString = `${this.apiUrl}/organizationInfo`;

    this.body = body;

    console.log(this.body);
    console.log(urlString);

    // send to api

    return this.http.post(urlString, this.body);
  }
}
