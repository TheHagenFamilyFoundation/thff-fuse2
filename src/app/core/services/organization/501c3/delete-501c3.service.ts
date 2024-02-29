import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import { AuthService } from '../../../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class Delete501c3Service {
    apiUrl: string;

    results;

    body;

    constructor(private http: HttpClient, private authService: AuthService) {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('Delete501c3Service - this.apiUrl', this.apiUrl);
        }

        console.log('Delete501c3Service - this.apiUrl', this.apiUrl);
    }

    delete501c3(id: string): Observable<any> {
        console.log('delete501c3byOrgID');

        const urlString = `${this.apiUrl}/organization-501c3/${id}`;

        return this.http.delete(urlString);
    }
}
