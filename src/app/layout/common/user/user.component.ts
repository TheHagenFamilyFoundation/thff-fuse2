import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { BooleanInput } from '@angular/cdk/coercion';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'app/core/user/user.types';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: User;

    currentUser: any;

    userName: string;

    organizations: any;

    lois: any;

    inOrgCheck: boolean;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _authService: AuthService
    ) {
        this._authService.currentUser.subscribe((x) => {
            console.log('user component - constructor - x', x);
            this.currentUser = x;
            if (this.currentUser && this.currentUser) {
                this.user = this.currentUser;
                this.userName = this.user.username;
            } else {
                console.error('user component - no user');
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {}

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
    //  * Update the user status
    //  *
    //  * @param status
    //  */
    // updateUserStatus(status: string): void {
    //     // Return if user is not available
    //     if (!this.user) {
    //         return;
    //     }

    //     // Update the user
    //     this._authService
    //         .update({
    //             ...this.user,
    //             status,
    //         })
    //         .subscribe();
    // }

    /**
     * Sign out
     */
    signOut(): void {
        this._router.navigate(['/sign-out']);
    }
}
