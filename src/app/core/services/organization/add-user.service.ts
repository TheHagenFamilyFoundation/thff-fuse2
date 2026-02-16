import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddUserService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  addUser(users): Observable<any> {
    const data = users;

    return this.http.post(`${this.apiUrl}/addUser`, data);
  }
}
