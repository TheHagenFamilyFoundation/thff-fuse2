import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from 'environments/environment';


@Injectable({
    providedIn: 'root'
})
export class BackendService {
    apiUrl: string;
    pinger: any;

    constructor(private http: HttpClient, private _authService: AuthService, private _router: Router) {
        this.getBackendURL();

        console.log('BackendService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        this.apiUrl = environment.apiUrl;
    }

    health(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/health`;

        console.log('health url - ', urlString);

        return this.http.get(urlString);
    }

    ping(): Observable<any> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/ping`;

        console.log('Inside Ping');
        console.log('check localStorage', localStorage.getItem('accessToken'));
        const token = localStorage.getItem('accessToken');

        console.log('ping url - ', urlString);

        return this.http.post(urlString, { token });
    }

    startPing(): void {
        console.log('starting ping');
        this.pinger = setInterval(() => {
            this.backendPinger();
        }, 30000);
    }

    stopPing(): void {
        console.log('stopping ping');
        this.pinger = null;
    }

    //runs every 30 seconds
    backendPinger(): void {
        console.log('pinging backend');
        this.ping()
            .subscribe((health) => {
                console.log('backend pinger', health);

                this._authService.check().subscribe((authenticated) => {
                    if (!authenticated) {
                        this._router.navigate(['/sign-out']);
                    }
                });

            });
    }

}
