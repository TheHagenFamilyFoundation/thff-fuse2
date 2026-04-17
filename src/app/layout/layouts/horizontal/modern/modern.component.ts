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

import packageJson from '../../../../../../package.json';

@Component({
    standalone: false,
    selector: 'modern-layout',
    templateUrl: './modern.component.html',
    styleUrls: ['./modern.component.scss'],
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

    version: string = packageJson.version;

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
    ) { }

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
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                this.getOrganizations();
            }
        }
        this.checkLoggedIn();
    }

    checkLoggedIn(): void {
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
                ); // contains token
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                // TODO
                this.getOrganizations();
            }

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
        this._getUserService
            .getUserbyID(this.currentUser._id || this.currentUser.id)
            .subscribe((user) => {
                if (user) {
                    if (user.organizations.length > 0) {
                        this.organizations = user.organizations;

                        this.inOrganization = true;

                        this._inOrgService.changeMessage(true);
                    } else {
                        this.inOrganization = false;

                        this._inOrgService.changeMessage(false);
                    }
                } else {
                }
            });
    } // end of getOrganizations

    viewOrgs(): void {
        this._router.navigate(['/pages/organizations']);
    }

    createOrg(): void {
        this._router.navigate(['/pages/organization/create']);
    }
}
