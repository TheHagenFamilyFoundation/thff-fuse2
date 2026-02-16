import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GetOrganizationInfoService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getOrgInfobyOrgID(orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization-info?organization=${orgID}`;

        return this.http.get(urlString);
    }

    getOrgInfobyID(orgInfoID: string): Observable<any> {
        const urlString = `${this.apiUrl}/organizationInfo?organizationID=${orgInfoID}`;

        return this.http.get(urlString);
    }
}
