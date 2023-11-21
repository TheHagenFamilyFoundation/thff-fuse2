import { Component, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { BackendService } from './core/services/backend.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(public authService: AuthService, public _backendService: BackendService) { }

    ngOnInit(): void {
        console.log('app init');

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

        this.backendHealthChecker();
    }

    backendHealthChecker(): void {

        this._backendService
            .health()
            .subscribe((health) => {
                console.log('health', health);
            });
    };

}
