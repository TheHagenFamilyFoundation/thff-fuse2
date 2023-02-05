import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { GetUserService } from '../../../../core/services/user/get-user.service';
import { InOrgService } from '../../../../core/services/user/in-org.service';
import { DirectorService } from '../../../../core/services/user/director.service';
// import { User } from 'app/core/user/user.types';
@Component({
    selector: 'modern-layout',
    templateUrl: './modern.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ModernLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;

    // currentUser: User;
    currentUser: any;
    user: any;
    email: string;
    accessLevel: number;
    isDirector: boolean;
    organizations: any;
    inOrganization: boolean;
    isLoggedIn: boolean;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _authService: AuthService,
        private _getUserService: GetUserService,
        private _inOrgService: InOrgService,
        private _directorService: DirectorService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        // console.log('expired', this._authService.check());
        this._authService.check().subscribe((authenticated) => {
            this.isLoggedIn = authenticated;
        });

        console.log('1 - this.isLoggedIn', this.isLoggedIn);

        if (this.isLoggedIn) {
            console.log(
                'toolbar - currentUser',
                localStorage.getItem('currentUser')
            );

            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                );
                console.log('toolbar - ', this.currentUser);
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                console.log('toolbar - this.accessLevel', this.accessLevel);

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
        console.log('toolbar - checkLoggedIn');

        this._authService.check().subscribe((authenticated) => {
            this.isLoggedIn = authenticated;
        });

        console.log('2 - this.isLoggedIn', this.isLoggedIn);

        if (this.isLoggedIn) {
            console.log(
                'toolbar - checkLoggedIn - currentUser',
                localStorage.getItem('currentUser')
            );

            if (localStorage.getItem('currentUser')) {
                this.currentUser = JSON.parse(
                    localStorage.getItem('currentUser')
                ); // contains token
                console.log('toolbar - username ', this.currentUser.username);
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

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }

    // check if user is in an organization
    getOrganizations(): void {
        console.log('modern - get organizations', this.email);

        this._getUserService
            .getUserbyID(this.currentUser.id)
            .subscribe((user) => {
                console.log('user', user);

                if (user.length > 0) {
                    if (user[0].organizations.length > 0) {
                        this.organizations = user[0].organizations;

                        console.log('this.organizations', this.organizations);

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

    viewOrgs(): void {
        console.log('go to view orgs page');

    }

    createOrg(): void {
        console.log('go to create org page');
        this._router.navigate(['/pages/organization/create']);
    }

}
