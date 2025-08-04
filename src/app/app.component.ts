import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { BackendService } from './core/services/backend.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

    // pinger: any;

    /**
     * Constructor
     */
    constructor(public authService: AuthService, public _backendService: BackendService) {

        console.log('APP CONSTRUCTOR');

        // Set the backend URL directly from environment
        this.authService.setBackendURL();

    }

    ngOnInit(): void {
        console.log('app init');

        this.backendHealthChecker();

    }

    // ngOnDestroy(): void {
    //     if (this.pinger) {
    //         clearInterval(this.pinger);
    //     }
    // }

    backendHealthChecker(): void {

        this._backendService
            .health()
            .subscribe((health) => {
                //TODO: output status to frontend
                console.log('health', health);
            });
    };

}
