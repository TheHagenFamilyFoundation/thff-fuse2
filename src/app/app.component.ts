import { Component, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(public authService: AuthService) {}

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
    }
}
