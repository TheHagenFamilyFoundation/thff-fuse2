import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation,
    OnDestroy,
} from '@angular/core';
import { AppConfig, Scheme, Theme, Themes } from 'app/core/config/app.config';
import { FuseConfigService } from '@fuse/services/config';
import { FuseAlertType } from '@fuse/components/alert';
import { SettingsService } from 'app/core/services/user/settings.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
    selector: 'settings-app',
    templateUrl: './app-settings.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppComponent implements OnInit, OnDestroy {
    config: AppConfig;
    scheme: 'dark' | 'light';
    settingsScheme: string;
    currentUser: any;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    showAlert: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _settingsService: SettingsService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {
                // Store the config
                this.config = config;
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
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
        this.settingsScheme = scheme;
    }
    saveScheme(): void {
        console.log(this.settingsScheme);

        //create payload
        //need scheme - this.settingsScheme
        //need userID - from currentUser object from localStorage

        if (localStorage.getItem('currentUser')) {
            this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
            console.log('app-settings - ', this.currentUser);

            const payload = {
                scheme: this.settingsScheme,
                userID: this.currentUser.id,
            };

            console.log('payload', payload);

            //make a call to the service
            this._settingsService.saveSettings(payload).subscribe(
                (response) => {
                    console.log('saving setting', response);

                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: response.message,
                    };
                    // Show the alert
                    this.showAlert = true;
                },
                (response) => {
                    console.log('sign-in - response', response);

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.message,
                    };

                    // Show the alert
                    this.showAlert = true;
                }
            );
        } else {
            //logout as there is no currentUser
        }
    }
}
