import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UpdateOrganizationInfoService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    updateOrganizationInfo(orgInfoID: string, body: any): Observable<any> {
        const urlString = `${this.apiUrl}/organization-info?organizationInfoID=${orgInfoID}`;

        // send to api
        return this.http.patch(urlString, body);
    }
}
