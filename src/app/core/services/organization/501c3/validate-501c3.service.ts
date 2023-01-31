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
export class Validate501c3Service {
  apiUrl: string;

  results;

  body;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('Validate501c3Service - this.apiUrl', this.apiUrl);
    }

    console.log('Validate501c3Service - this.apiUrl', this.apiUrl);
  }

  validate501c3(data): Observable<any> {
    return this.http.put(`${this.apiUrl}/validate501c3`, data);
  }
}
