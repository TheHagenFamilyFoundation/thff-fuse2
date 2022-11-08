import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable()
export class CreateOrganizationService {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('CreateOrganizationService - this.apiUrl', this.apiUrl);
    }

    console.log('CreateOrganizationService - this.apiUrl', this.apiUrl);
  }

  createOrganization(body): Observable<any> {
    console.log('createOrganization');

    const urlString = `${this.apiUrl}/organization`;

    this.body = body;

    console.log(this.body);
    console.log(urlString);

    // send to api

    return this.http.post(urlString, this.body);
  }
}
