import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';

import { AuthService } from 'app/core/auth/auth.service';
import { GetUserService } from 'app/core/services/user/get-user.service';
import { InOrgService } from 'app/core/services/user/in-org.service';
// import { DirectorService } from '../../../../core/services/user/director.service';

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
        private _inOrgService: InOrgService // private _directorService: DirectorService
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

        console.log('profile 1 - this.isLoggedIn', this.isLoggedIn);

        if (this.isLoggedIn) {
            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                );
                this.user = this.currentUser;
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                if (this.accessLevel > 1) {
                    this.isDirector = true;

                    // this.directorService.changeMessage(this.isDirector)
                } else {
                    this.isDirector = false;

                    // this.directorService.changeMessage(this.isDirector)
                }

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

        if (this.isLoggedIn) {
            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                );
                console.log('profile - email ', this.currentUser.email);
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                if (this.accessLevel > 1) {
                    this.isDirector = true;

                    // this.directorService.changeMessage(this.isDirector)
                } else {
                    this.isDirector = false;

                    // this.directorService.changeMessage(this.IsDirector)
                }

                // TODO
                this.getOrganizations();
            }

            // this.LoggedIn = true;
        }
    }

    // check if user is in an organization
    getOrganizations(): void {
        console.log('profile - get organizations', this.email);

        this._getUserService
            .getUserbyID(this.currentUser.id)
            .subscribe((user) => {
                console.log('user', user);

                if (user.length > 0) {
                    if (user[0].organizations.length > 0) {
                        this.organizations = user[0].organizations;

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
