import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from 'app/core/auth/auth.service';
import { GetUserService } from 'app/core/services/user/get-user.service';
import { InOrgService } from 'app/core/services/user/in-org.service';
import { SettingsService } from 'app/core/services/user/settings.service';
import { FuseConfigService } from '@fuse/services/config';
import { AppConfig, Scheme } from 'app/core/config/app.config';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
})
export class ProfileComponent implements OnInit, OnDestroy {
    currentUser: any;
    user: any;
    email: string;
    accessLevel: number;
    isDirector: boolean;
    organizations: any;
    inOrganization: boolean;
    isLoggedIn: boolean;

    // Tab state: 'home' or 'settings'
    activeTab: 'home' | 'settings' = 'home';

    // Settings panels
    selectedPanel: string = 'account';
    panels: any[] = [
        {
            id: 'account',
            icon: 'heroicons_outline:user-circle',
            title: 'Account',
            description: 'Manage your information',
        },
        {
            id: 'security',
            icon: 'heroicons_outline:lock-closed',
            title: 'Security',
            description: 'Manage your password.',
        },
        {
            id: 'app',
            icon: 'heroicons_outline:cog',
            title: 'App',
            description: 'Change App Settings',
        },
        // {
        //     id: 'notifications',
        //     icon: 'heroicons_outline:bell',
        //     title: 'Notifications',
        //     description: "Manage when you'll be notified on which channels",
        // },
    ];

    // Account form
    accountForm: FormGroup;
    accountSaving = false;
    accountAlert: { type: string; message: string } | null = null;

    // Security form
    securityForm: FormGroup;
    securitySaving = false;
    securityAlert: { type: string; message: string } | null = null;

    // App settings
    config: AppConfig;
    themeToggled = false;
    selectedScheme: string;
    appSaving = false;
    appAlert: { type: string; message: string } | null = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _getUserService: GetUserService,
        private _inOrgService: InOrgService,
        private _formBuilder: FormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _settingsService: SettingsService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
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
                this.user = this.currentUser;
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                this.getOrganizations();
            }
        }
        this.checkLoggedIn();

        // Initialize forms
        this.accountForm = this._formBuilder.group({
            email: [{ value: this.currentUser?.email || '', disabled: true }],
            firstName: [this.currentUser?.firstName || ''],
            lastName: [this.currentUser?.lastName || ''],
        });

        this.securityForm = this._formBuilder.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [
                Validators.required,
                Validators.pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{10,}$/)
            ]],
            confirmPassword: ['', Validators.required],
        });

        // Subscribe to app config for theme
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {
                this.config = config;
                this.selectedScheme = config.scheme;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
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
                );
                this.email = this.currentUser.email;
                this.accessLevel = this.currentUser.accessLevel;

                this.getOrganizations();
            }
        }
    }

    getOrganizations(): void {
        this._getUserService
            .getUserbyID(this.currentUser._id)
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
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Tab & Settings methods
    // -----------------------------------------------------------------------------------------------------

    setTab(tab: 'home' | 'settings'): void {
        this.activeTab = tab;
    }

    goToPanel(panelId: string): void {
        this.selectedPanel = panelId;
    }

    getPanelInfo(id: string): any {
        return this.panels.find((panel) => panel.id === id) || {};
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Account methods
    // -----------------------------------------------------------------------------------------------------

    saveAccount(): void {
        this.accountSaving = true;
        this.accountAlert = null;

        const payload = {
            firstName: this.accountForm.get('firstName').value,
            lastName: this.accountForm.get('lastName').value,
        };

        this._getUserService.updateProfile(payload)
            .pipe(finalize(() => this.accountSaving = false))
            .subscribe({
                next: (response) => {
                    this.accountAlert = { type: 'success', message: 'Profile updated successfully' };

                    // Update localStorage with new user data
                    if (response.user) {
                        this.currentUser = response.user;
                        localStorage.setItem('currentUser', JSON.stringify(response.user));
                    }
                },
                error: (err) => {
                    this.accountAlert = {
                        type: 'error',
                        message: err?.error?.message || 'Error updating profile'
                    };
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Security methods
    // -----------------------------------------------------------------------------------------------------

    savePassword(): void {
        // Check passwords match
        const newPass = this.securityForm.get('newPassword').value;
        const confirmPass = this.securityForm.get('confirmPassword').value;

        if (newPass !== confirmPass) {
            this.securityAlert = { type: 'error', message: 'New passwords do not match' };
            return;
        }

        this.securitySaving = true;
        this.securityAlert = null;

        const payload = {
            currentPassword: this.securityForm.get('currentPassword').value,
            newPassword: newPass,
        };

        this._getUserService.changePassword(payload)
            .pipe(finalize(() => this.securitySaving = false))
            .subscribe({
                next: () => {
                    this.securityAlert = { type: 'success', message: 'Password changed successfully' };
                    this.securityForm.reset();
                },
                error: (err) => {
                    this.securityAlert = {
                        type: 'error',
                        message: err?.error?.message || 'Error changing password'
                    };
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ App Settings methods
    // -----------------------------------------------------------------------------------------------------

    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
        this.selectedScheme = scheme;
        this.themeToggled = true;
        this.appAlert = null;
    }

    saveScheme(): void {
        if (!this.currentUser) { return; }

        this.appSaving = true;
        this.appAlert = null;

        const payload = {
            scheme: this.selectedScheme,
            userID: this.currentUser._id,
        };

        this._settingsService.saveSettings(payload)
            .pipe(finalize(() => {
                this.appSaving = false;
                this.themeToggled = false;
            }))
            .subscribe({
                next: (response) => {
                    // Persist scheme to localStorage so it survives page refresh
                    localStorage.setItem('userScheme', this.selectedScheme);
                    this.appAlert = { type: 'success', message: response.message || 'Theme saved' };
                },
                error: (err) => {
                    this.appAlert = {
                        type: 'error',
                        message: err?.error?.message || 'Error saving theme'
                    };
                }
            });
    }
}
