import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { BackendService } from './core/services/backend.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

    pinger: any;

    /**
     * Constructor
     */
    constructor(public authService: AuthService, public _backendService: BackendService) {

        console.log('APP CONSTRUCTOR');

        try {
            this.authService.initializeBackendURL().subscribe((backend) => {
                console.log('backend', backend);
                // console.log('auth-service - this.apiUrl', this.apiUrl);
                sessionStorage.setItem('backend_url', backend.url);
                //set auth service
                this.authService.setBackendURL();
            });
        } catch (e) {
            console.error(e);
        }

    }

    ngOnInit(): void {
        console.log('app init');

        this.backendHealthChecker();

    }

    ngOnDestroy(): void {
        if (this.pinger) {
            clearInterval(this.pinger);
        }
    }

    backendHealthChecker(): void {

        this._backendService
            .health()
            .subscribe((health) => {
                //TODO: output status to frontend
                console.log('health', health);
            });
    };

}
