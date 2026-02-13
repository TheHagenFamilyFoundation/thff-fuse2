import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { AuthUtils } from './core/auth/auth.utils';
import { BackendService } from './core/services/backend.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

    constructor(public authService: AuthService, public _backendService: BackendService) {
        // Set the backend URL directly from environment
        this.authService.setBackendURL();
    }

    ngOnInit(): void {
        this.backendHealthChecker();

        // If user is already authenticated (page refresh), start the session ping
        const token = this.authService.accessToken;
        if (token && !AuthUtils.isTokenExpired(token)) {
            this._backendService.startPing();
        }
    }

    ngOnDestroy(): void {
        this._backendService.stopPing();
    }

    backendHealthChecker(): void {
        this._backendService.health().subscribe({
            error: (err) => {
                console.error('Backend health check failed:', err);
            }
        });
    }
}
