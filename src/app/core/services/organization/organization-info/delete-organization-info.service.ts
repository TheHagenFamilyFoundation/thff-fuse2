import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DeleteOrganizationInfoService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  deleteOrgInfobyOrgInfoID(orgInfoID: string): Observable<any> {
    const urlString = `${this.apiUrl}/organizationInfo/${orgInfoID}`;

    return this.http.delete(urlString);
  }
}
