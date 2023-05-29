import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class DirectorService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('Director Service - this.apiUrl', this.apiUrl);
        }

        console.log('Director Service - this.apiUrl', this.apiUrl);
    }

    vote(data: any): Observable<any> {
        const urlString = `${this.apiUrl}/vote`;

        return this.http.post(urlString, data);
    }
}
