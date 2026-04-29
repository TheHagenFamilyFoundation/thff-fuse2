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
    /** Interval id for periodic JWT lifetime checks and proactive refresh. */
    private sessionRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
    private readonly SESSION_REFRESH_INTERVAL_MS = 30000;
    private _isRefreshing = false;

    // Refresh when less than 50% of token lifetime remains
    private readonly REFRESH_THRESHOLD = 0.5;

    constructor(private http: HttpClient, private _authService: AuthService, private _router: Router) {
        this.apiUrl = environment.apiUrl;
    }

    health(): Observable<any> {
        return this.http.get(`${this.apiUrl}/health`);
    }

    startPing(): void {
        if (this.sessionRefreshIntervalId) {
            return;
        }

        this.sessionRefreshIntervalId = setInterval(() => {
            this.checkSession();
        }, this.SESSION_REFRESH_INTERVAL_MS);
    }

    stopPing(): void {
        if (this.sessionRefreshIntervalId) {
            clearInterval(this.sessionRefreshIntervalId);
            this.sessionRefreshIntervalId = null;
        }
    }

    private checkSession(): void {
        const token = this._authService.accessToken;

        // No token — kick out immediately
        if (!token) {
            this.handleExpired();
            return;
        }

        // Check how much lifetime the token has remaining
        const lifetimeRemaining = AuthUtils.getTokenLifetimeRemaining(token);

        // If token is expired, attempt one refresh before kicking out
        if (AuthUtils.isTokenExpired(token)) {
            this.attemptRefresh();
            return;
        }

        // If token is past the refresh threshold, proactively refresh it
        // This keeps the session alive as long as the user is active
        if (lifetimeRemaining !== null && lifetimeRemaining < this.REFRESH_THRESHOLD) {
            this.attemptRefresh();
            return;
        }

        // Token still has plenty of lifetime; next interval will re-check (no HTTP call).
    }

    private attemptRefresh(): void {
        // Prevent concurrent refresh attempts
        if (this._isRefreshing) { return; }
        this._isRefreshing = true;

        this._authService.signInUsingToken().subscribe({
            next: (result) => {
                this._isRefreshing = false;
                if (!result) {
                    // Refresh failed — session is truly expired
                    this.handleExpired();
                }
            },
            error: () => {
                this._isRefreshing = false;
                this.handleExpired();
            }
        });
    }

    private handleExpired(): void {
        this.stopPing();
        this._authService.signOut();
        this._router.navigate(['/sign-out']);
    }
}
