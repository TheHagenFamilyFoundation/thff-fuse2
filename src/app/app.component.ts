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
            this.authService.initializeBackendURL().subscribe((url) => {
                console.log('url', url);
                console.log('initialize backend');
                console.log(
                    'this.getBackendURL()',
                    this.authService.getBackendURL()
                );
                // console.log('auth-service - this.apiUrl', this.apiUrl);
            });
        } catch (e) {
            console.error(e);
        }
    }
}
