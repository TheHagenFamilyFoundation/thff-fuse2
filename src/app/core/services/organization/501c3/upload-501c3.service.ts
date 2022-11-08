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
export class Upload501c3Service {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('Upload501c3Service - this.apiUrl', this.apiUrl);
    }

    console.log('Upload501c3Service - this.apiUrl', this.apiUrl);
  }

  // file from event.target.files[0]
  upload501c3(file: File, orgID: string): Observable<any> {
    console.log('upload501c3');

    const urlString = `${this.apiUrl}/upload501c3`;

    const formData = new FormData();
    formData.append('avatar', file);

    const params = new HttpParams();

    const options = {
      params,
      reportProgress: true,
    };

    const req = new HttpRequest('POST', urlString, formData, options);

    console.log('req', req);

    return this.http.request(req);
  }
}
