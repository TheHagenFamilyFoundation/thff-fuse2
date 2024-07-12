import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    OnDestroy,
} from '@angular/core';
import { AppConfig, Scheme, Theme, Themes } from 'app/core/config/app.config';
import {
    FormBuilder,
    FormGroup,
    NgForm,
    Validators,
    FormControl,
} from '@angular/forms';
import { FuseConfigService } from '@fuse/services/config';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from 'app/core/services/user/settings.service';
import { Subject, takeUntil, finalize } from 'rxjs';
@Component({
    selector: 'settings-app',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppComponent implements OnInit, OnDestroy {
    @ViewChild('saveSettingsNgForm') saveSettingsNgForm: NgForm;

    config: AppConfig;
    scheme: 'dark' | 'light';
    settingsScheme: string;
    currentUser: any;

    toggledScheme: boolean = false;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: 'default',
    };
    // saveSettingsForm: FormGroup;
    showAlert: boolean = false;
    durationInSeconds: number = 3;
    saveSettingsForm = new FormGroup({
        scheme: new FormControl('', Validators.required),
    });

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _settingsService: SettingsService,
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar
    ) { }

    // // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // get f() {
    //     return this.saveSettingsForm.controls;
    // }

    // // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // submit() {
    //     console.log(this.saveSettingsForm.value);
    // }

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

        // Create the form
        this.saveSettingsForm = this._formBuilder.group({
            scheme: ['', [Validators.required]],
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

    // /**
    //  * Set the scheme on the config
    //  *
    //  * @param scheme
    //  */
    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
        this.showAlert = false;
        this.settingsScheme = scheme;
        this.toggledScheme = true;
    }
    saveScheme(): void {
        console.log('saveScheme');
        this.alert.message = 'saving';
        this.showAlert = true;
        this.toggledScheme = false;
        // this.openSnackBar();
        // setTimeout(() => {
        //     this.clearAlertMessage();
        // }, 3000);

        // if (this.saveSettingsForm.valid) {
        //     console.log('settings form data :: ', this.saveSettingsForm.value);
        //     console.log(
        //         'settings form data sheme :: ',
        //         this.saveSettingsForm.value.scheme
        //     );
        // }
        // // Return if the form is invalid
        // if (this.saveSettingsForm.invalid) {
        //     return;
        // }
        // // Disable the form
        // this.saveSettingsForm.disable();
        // // Hide the alert
        // this.showAlert = false;
        // console.log('hiding alert');
        // // Re-enable the form
        // this.saveSettingsForm.enable();
        // // Reset the form
        // this.saveSettingsNgForm.resetForm();
        // console.log('showing alert');
        // this.alert = {
        //     type: 'success',
        //     message: 'settings updated',
        // };
        // // Show the alert
        // this.showAlert = true;
        // console.log('alert = ', this.alert);
        // setTimeout(() => {
        //     this.showAlert = false;
        // }, 3000);
        // const myTimeout = setTimeout(() => {
        //     // Disable the form
        //     this.saveSettingsForm.disable();
        //     // Hide the alert
        //     this.showAlert = false;
        //     console.log('hiding alert');
        //     // Re-enable the form
        //     this.saveSettingsForm.enable();
        //     console.log('this.showAlert is false');
        // }, 5000);
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
            this._settingsService
                .saveSettings(payload)
                .pipe(
                    finalize(() => {
                        // // Re-enable the form
                        // this.saveSettingsForm.enable();
                        // // Reset the form
                        // this.saveSettingsNgForm.resetForm();
                        // console.log('showing alert');
                        // // Show the alert
                        // this.showAlert = true;
                        // console.log('alert = ', this.alert);
                        this.openSnackBar(this.alert);
                    })
                )
                .subscribe(
                    (response) => {
                        console.log('saving setting', response);
                        // Set the alert
                        this.alert = {
                            type: 'success',
                            message: response.message,
                        };
                        console.log('inside success - alert = ', this.alert);

                        // this.openSnackBar(this.alert);
                    },
                    (response) => {
                        console.log('sign-in - response', response);
                        // Set the alert
                        this.alert = {
                            type: 'error',
                            message: response.error.message,
                        };
                        console.log('inside error - alert = ', this.alert);
                        // this.openSnackBar(this.alert);
                    }
                );
        } else {
            //logout as there is no currentUser
        }
    }
    // clearAlertMessage(): void {
    //     this.showAlert = false;
    // }

    openSnackBar(alert): void {
        this._snackBar.open(alert.message, 'OK', {
            duration: this.durationInSeconds * 1000,
        });
    }
}
