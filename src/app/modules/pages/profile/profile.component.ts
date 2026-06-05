import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewEncapsulation,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AuthService } from 'app/core/auth/auth.service';
import { GetUserService } from 'app/core/services/user/get-user.service';
import { InOrgService } from 'app/core/services/user/in-org.service';
import { UserPreferencesService } from 'app/core/services/user/user-preferences.service';
import { SettingsService } from 'app/core/services/user/settings.service';
import { dedupeUserOrganizations } from 'app/core/utilities/organization-access.util';

@Component({
    standalone: false,
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
    organizations: any[] = [];
    organizationsLoading = false;
    inOrganization: boolean;
    isLoggedIn: boolean;
    private preferencesLoaded = false;

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
            id: 'preferences',
            icon: 'heroicons_outline:adjustments',
            title: 'Preferences',
            description: 'Table and display defaults',
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
    accountAlert: { type: 'success' | 'error' | 'info' | 'warning'; message: string } | null = null;

    // Security form
    securityForm: FormGroup;
    securitySaving = false;
    securityAlert: { type: string; message: string } | null = null;

    tablePageSizeOptions: readonly number[];
    preferencesTablePageSize: number;
    savedPreferencesTablePageSize: number;
    preferencesSaving = false;
    preferencesSavedFlash = false;
    preferencesAlert: { type: 'error'; message: string } | null = null;

    private preferencesSavedTimer: ReturnType<typeof setTimeout> | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _getUserService: GetUserService,
        private _inOrgService: InOrgService,
        private _userPreferences: UserPreferencesService,
        private _settingsService: SettingsService,
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        this.tablePageSizeOptions = this._userPreferences.tablePageSizeOptions;
        this.preferencesTablePageSize = this._userPreferences.tablePageSize;
        this.syncSavedPreferencesValue();

        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.user = this.currentUser;
            this.email = this.currentUser.email;
            this.accessLevel = this.currentUser.accessLevel;
            this.getOrganizations();
        }

        this._authService.check().subscribe((authenticated) => {
            this.isLoggedIn = authenticated;
        });

        this._authService.checkDirector().subscribe((isADirector) => {
            this.isDirector = isADirector;
        });

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
    }

    ngOnDestroy(): void {
        this.clearPreferencesSavedTimer();
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    getOrganizations(): void {
        const userID = this.currentUser?._id ?? this.currentUser?.id;
        if (!userID) {
            return;
        }

        this.organizationsLoading = true;
        this._getUserService
            .getUserbyID(userID)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (user) => {
                    const orgs = user
                        ? dedupeUserOrganizations(user.organizations)
                        : [];
                    this.organizations = orgs;
                    this.inOrganization = orgs.length > 0;
                    this._inOrgService.changeMessage(this.inOrganization);
                    this.organizationsLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.organizations = [];
                    this.inOrganization = false;
                    this.organizationsLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Tab & Settings methods
    // -----------------------------------------------------------------------------------------------------

    setTab(tab: 'home' | 'settings'): void {
        this.activeTab = tab;
        if (tab === 'settings') {
            this.ensurePreferencesLoaded();
        }
    }

    goToPanel(panelId: string): void {
        this.selectedPanel = panelId;
        if (panelId === 'preferences') {
            this.ensurePreferencesLoaded();
        }
    }

    private ensurePreferencesLoaded(): void {
        if (this.preferencesLoaded) {
            return;
        }
        this.preferencesLoaded = true;
        this.loadPreferences();
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

    onAccountAlertDismissed(dismissed: boolean): void {
        if (dismissed) {
            this.accountAlert = null;
        }
    }

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
                    const msg =
                        response?.message === 'Profile updated'
                            ? 'Profile updated successfully'
                            : response?.message || 'Profile updated successfully';
                    this.accountAlert = { type: 'success', message: msg };

                    if (response?.user) {
                        this.currentUser = response.user;
                        this.user = response.user;
                        localStorage.setItem('currentUser', JSON.stringify(response.user));
                    }

                    this._snackBar.open(msg, 'Dismiss', { duration: 6000 });
                },
                error: (err) => {
                    const errMsg = err?.error?.message || 'Error updating profile';
                    this.accountAlert = { type: 'error', message: errMsg };
                    this._snackBar.open(errMsg, 'Dismiss', { duration: 8000 });
                },
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
    // @ Preferences methods
    // -----------------------------------------------------------------------------------------------------

    get preferencesChanged(): boolean {
        return this.preferencesTablePageSize !== this.savedPreferencesTablePageSize;
    }

    get showPreferencesActions(): boolean {
        return this.preferencesChanged || this.preferencesSaving || this.preferencesSavedFlash;
    }

    private syncSavedPreferencesValue(): void {
        this.savedPreferencesTablePageSize = this.preferencesTablePageSize;
    }

    private loadPreferences(): void {
        const userID = this.currentUser?.id ?? this.currentUser?._id;
        if (!userID) {
            this.preferencesTablePageSize = this._userPreferences.tablePageSize;
            this.syncSavedPreferencesValue();
            return;
        }

        this._settingsService.getSettingsByUserID(userID)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (settings) => {
                    this._userPreferences.initFromUserSettings(settings);
                    this.preferencesTablePageSize = this._userPreferences.tablePageSize;
                    this.syncSavedPreferencesValue();
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.preferencesTablePageSize = this._userPreferences.tablePageSize;
                    this.syncSavedPreferencesValue();
                },
            });
    }

    savePreferences(): void {
        this.preferencesSaving = true;
        this.preferencesAlert = null;
        this.preferencesSavedFlash = false;

        this._userPreferences.saveTablePageSize(this.preferencesTablePageSize)
            .pipe(finalize(() => this.preferencesSaving = false))
            .subscribe({
                next: () => {
                    this.syncSavedPreferencesValue();
                    this.flashPreferencesSaved();
                },
                error: (err) => {
                    this.preferencesAlert = {
                        type: 'error',
                        message: err?.error?.message || 'Error saving preferences',
                    };
                },
            });
    }

    private flashPreferencesSaved(): void {
        this.clearPreferencesSavedTimer();
        this.preferencesSavedFlash = true;
        this._changeDetectorRef.markForCheck();
        this.preferencesSavedTimer = setTimeout(() => {
            this.preferencesSavedFlash = false;
            this.preferencesSavedTimer = null;
            this._changeDetectorRef.markForCheck();
        }, 2000);
    }

    private clearPreferencesSavedTimer(): void {
        if (this.preferencesSavedTimer !== null) {
            clearTimeout(this.preferencesSavedTimer);
            this.preferencesSavedTimer = null;
        }
    }

}
