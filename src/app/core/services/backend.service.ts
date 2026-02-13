import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthUtils } from '../auth/auth.utils';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BackendService {
    apiUrl: string;
    private pingInterval: any = null;
    private readonly PING_INTERVAL_MS = 30000; // 30 seconds

    constructor(private http: HttpClient, private _authService: AuthService, private _router: Router) {
        this.apiUrl = environment.apiUrl;
    }

    health(): Observable<any> {
        return this.http.get(`${this.apiUrl}/health`);
    }

    ping(): Observable<any> {
        return this.http.post(`${this.apiUrl}/ping`, {});
    }

    startPing(): void {
        // Don't start if already running
        if (this.pingInterval) { return; }

        this.pingInterval = setInterval(() => {
            this.checkSession();
        }, this.PING_INTERVAL_MS);
    }

    stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private checkSession(): void {
        const token = this._authService.accessToken;

        // No token — kick out immediately
        if (!token) {
            this.handleExpired();
            return;
        }

        // Token expired client-side — kick out without hitting backend
        if (AuthUtils.isTokenExpired(token)) {
            this.handleExpired();
            return;
        }

        // Token looks valid client-side — ping backend to confirm server-side
        // If the backend returns 401, the interceptor will handle sign-out
        this.ping().subscribe({
            error: () => {
                // 401 is handled by the interceptor, other errors are ignored
            }
        });
    }

    private handleExpired(): void {
        this.stopPing();
        this._authService.signOut();
        this._router.navigate(['/sign-out']);
    }
}
