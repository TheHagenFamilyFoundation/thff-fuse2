import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BackendService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();

        console.log('BackendService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (environment.production === true) {
            this.apiUrl = sessionStorage.getItem('backend_url');
        } else {
            this.apiUrl = environment.apiUrl;
        }
    }

    health(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/health`;

        console.log('health url - ', urlString);

        return this.http.get(urlString);
    }

    pinger(): Observable<any> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/ping`; //TODO

        console.log('Inside Pinger');
        console.log('check localStorage', localStorage.getItem('accessToken'));
        const token = localStorage.getItem('accessToken');

        console.log('ping url - ', urlString);

        return this.http.post(urlString, { token });
    }

}
