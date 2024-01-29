import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class UpdateOrganizationInfoService {
    apiUrl: string;

    results;

    body;

    constructor(private http: HttpClient, private authService: AuthService) {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log(
                'UpdateOrganizationInfoService - this.apiUrl',
                this.apiUrl
            );
        }

        console.log('UpdateOrganizationInfoService - this.apiUrl', this.apiUrl);
    }

    updateOrganizationInfo(orgInfoID: string, body: any): Observable<any> {
        console.log('updateOrganizationInfo', orgInfoID);
        console.log('body', body);

        //http://localhost:1337/organizationinfo?organizationInfoID=id
        const urlString = `${this.apiUrl}/organization-info?organizationInfoID=${orgInfoID}`;

        //should be just 1 field
        this.body = body;

        console.log('sending to backend', this.body);
        console.log(urlString);

        // send to api
        return this.http.patch(urlString, this.body);
    }
}
