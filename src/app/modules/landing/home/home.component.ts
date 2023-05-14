import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
@Component({
    selector: 'landing-home',
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(private _router: Router, private _authService: AuthService) {
    }

    ngOnInit(): void {
        console.log('check if user is logged in ');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
    }
}
