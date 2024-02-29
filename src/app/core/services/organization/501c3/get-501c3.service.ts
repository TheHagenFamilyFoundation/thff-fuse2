import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class Get501c3Service {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('Get501c3Service - this.apiUrl', this.apiUrl);
        }

        console.log('Get501c3Service - this.apiUrl', this.apiUrl);
    }

    // doc501c3 id
    get501c3(id: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization-501c3/${id}`;

        console.log('urlString', urlString);

        return this.http.get(urlString);
    }

    get501c3Info(orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/org501c3?orgID=${orgID}`;

        console.log('urlString', urlString);

        return this.http.get(urlString);
    }
}
