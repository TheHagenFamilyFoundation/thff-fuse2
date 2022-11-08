import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AddUserService {
  apiUrl: string;

  data: any;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!environment.production) {
      this.apiUrl = environment.apiUrl;
    } else {
      this.apiUrl = this.authService.getBackendURL();
      console.log('AddUserService - this.apiUrl', this.apiUrl);
    }

    console.log('AddUserService - this.apiUrl', this.apiUrl);
  }

  addUser(users): Observable<any> {
    const data = users;

    console.log('data', data);

    return this.http.post(`${this.apiUrl}/addUser`, data);
  }
}
