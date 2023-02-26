import { Component } from '@angular/core';

import { AuthService } from './core/auth/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    /**
     * Constructor
     */
    constructor(public authService: AuthService) {
        console.log('app-initialize backendurl');
        this.authService.initializeBackendURL();
    }
}
