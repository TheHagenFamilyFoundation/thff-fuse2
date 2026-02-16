import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable()
export class CreateOrganizationService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrganization(body): Observable<any> {
    const urlString = `${this.apiUrl}/organization`;

    // send to api
    return this.http.post(urlString, body);
  }
}
