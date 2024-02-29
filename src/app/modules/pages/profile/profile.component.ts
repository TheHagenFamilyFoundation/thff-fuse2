import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';

import { AuthService } from 'app/core/auth/auth.service';
import { GetUserService } from 'app/core/services/user/get-user.service';
import { InOrgService } from 'app/core/services/user/in-org.service';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ProfileComponent implements OnInit {
    // currentUser: User;
    currentUser: any;
    user: any;
    email: string;
    accessLevel: number;
    isDirector: boolean;
    organizations: any;
    inOrganization: boolean;
    isLoggedIn: boolean;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _getUserService: GetUserService,
        private _inOrgService: InOrgService
    ) {
        console.log('profile constructor - organizations', this.organizations);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        console.log('profile ngOnInit - organizations', this.organizations);

        this._authService.check().subscribe((authenticated) => {
            this.isLoggedIn = authenticated;
        });

        this._authService.checkDirector().subscribe((isADirector) => {
            this.isDirector = isADirector;
        });

        console.log('profile 1 - this.isLoggedIn', this.isLoggedIn);

        if (this.isLoggedIn) {
            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                );
                this.user = this.currentUser;
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                this.getOrganizations();
            }
        }
        this.checkLoggedIn();
    }

    checkLoggedIn(): void {
        console.log('profile - checkLoggedIn');

        this._authService.check().subscribe((authenticated) => {
            this.isLoggedIn = authenticated;
        });

        this._authService.checkDirector().subscribe((isADirector) => {
            this.isDirector = isADirector;
        });

        if (this.isLoggedIn) {
            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                );
                console.log('profile - email ', this.currentUser.email);
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                // TODO
                this.getOrganizations();
            }

            // this.LoggedIn = true;
        }
    }

    // check if user is in an organization
    getOrganizations(): void {
        console.log('profile - get organizations', this.email);

        console.log('this.currentUser', this.currentUser);

        this._getUserService
            .getUserbyID(this.currentUser._id)
            .subscribe((user) => {
                console.log('profile - user', user);
                if (user) {

                    if (user.organizations.length > 0) {
                        this.organizations = user.organizations;

                        console.log(
                            'profile - this.organizations',
                            this.organizations
                        );

                        this.inOrganization = true;

                        this._inOrgService.changeMessage(true);
                    } else {
                        console.log('not in any organizations');

                        this.inOrganization = false;

                        this._inOrgService.changeMessage(false);
                    }
                } else {
                    console.log('no user');
                }
            });
    } // end of getOrganizations
}
