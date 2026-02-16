import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CreateOrganizationInfoService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrganizationInfo(body): Observable<any> {
    const urlString = `${this.apiUrl}/organizationInfo`;

    // send to api
    return this.http.post(urlString, body);
  }
}
