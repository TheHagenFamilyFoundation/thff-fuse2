import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
import { dedupeUserOrganizations } from 'app/core/utilities/organization-access.util';

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
    isDirector = false;
    organizations: any;
    inOrganization = false;
    isLoggedIn: boolean;

    /** Top nav "Proposals": directors always; applicants when they belong to at least one organization (same bar as Organizations). */
    showProposalsNavLink = false;

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
        private _cdr: ChangeDetectorRef,
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

        this.checkLoggedIn();
    }

    checkLoggedIn(): void {
        this._authService.check()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((authenticated) => {
                this.isLoggedIn = authenticated;
                if (!authenticated) {
                    this.showProposalsNavLink = false;
                    this.inOrganization = false;
                    this._cdr.markForCheck();
                    return;
                }
                const raw = localStorage.getItem('currentUser');
                if (raw) {
                    this.currentUser = JSON.parse(raw);
                    this.email = this.currentUser.email;
                    this.accessLevel = this.currentUser.accessLevel;
                    this.getOrganizations();
                }
            });

        this._authService.checkDirector()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isADirector) => {
                this.isDirector = isADirector;
                this.syncProposalsNavLink();
            });
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
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                if (user) {
                    const orgs = dedupeUserOrganizations(user.organizations);
                    if (orgs.length > 0) {
                        this.organizations = orgs;

                        this.inOrganization = true;

                        this._inOrgService.changeMessage(true);
                        this.syncProposalsNavLink();
                    } else {
                        this.inOrganization = false;

                        this._inOrgService.changeMessage(false);
                        this.syncProposalsNavLink();
                    }
                } else {
                    this.inOrganization = false;
                    this.syncProposalsNavLink();
                }
            });
    } // end of getOrganizations

    private syncProposalsNavLink(): void {
        if (!this.isLoggedIn) {
            this.showProposalsNavLink = false;
            this._cdr.markForCheck();
            return;
        }
        if (this.isDirector) {
            this.showProposalsNavLink = true;
            this._cdr.markForCheck();
            return;
        }
        this.showProposalsNavLink = this.inOrganization;
        this._cdr.markForCheck();
    }

    viewOrgs(): void {
        this._router.navigate(['/pages/organizations']);
    }

    createOrg(): void {
        this._router.navigate(['/pages/organization/create']);
    }
}
