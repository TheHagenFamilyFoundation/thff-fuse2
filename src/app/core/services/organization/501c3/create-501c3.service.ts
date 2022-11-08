import { Injectable } from '@angular/core';
import {
  HttpClient, HttpParams, HttpRequest, HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class Create501c3Service {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('Create501c3Service - this.apiUrl', this.apiUrl);
    }

    console.log('Create501c3Service - this.apiUrl', this.apiUrl);
  }

  create501c3(body): Observable<any> {
    console.log('createOrganization');

    const urlString = `${this.apiUrl}/org501c3`;

    this.body = body;

    console.log(this.body);
    console.log(urlString);

    // send to api

    return this.http.post(urlString, this.body);
  }
}
