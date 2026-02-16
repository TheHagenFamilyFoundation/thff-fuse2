import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Create501c3Service {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create501c3(body): Observable<any> {
    const urlString = `${this.apiUrl}/org501c3`;

    // send to api
    return this.http.post(urlString, body);
  }
}
