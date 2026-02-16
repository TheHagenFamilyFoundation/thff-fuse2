/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    BehaviorSubject,
    catchError,
    Observable,
    of,
    switchMap,
    throwError,
} from 'rxjs';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/services/user/user.service';
import { environment } from '../../../environments/environment';
@Injectable()
export class AuthService {
    private _authenticated: boolean = false;
    private apiUrl = environment.apiUrl;
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }
    // /**
    //  * Setter & getter for current user
    //  */
    // set currentUser(currentUser: any) {
    //     console.log('storing currentUser', currentUser);
    //     localStorage.setItem('currentUser', JSON.stringify(currentUser));
    // }

    // get currentUser(): any {
    //     return localStorage.getItem('currentUser') ?? '';
    // }

    set currentUser(user: string) {
        localStorage.setItem('currentUser', user);
    }

    get currentUser(): string {
        return localStorage.getItem('currentUser') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Establish a session from a server response containing user, token, and settings.
     * Used by both signIn and signUp flows.
     */
    establishSession(response: { user: any; token: string; userSettings?: any }): void {
        this.accessToken = response.token;
        this.currentUser = JSON.stringify(response.user);
        this._authenticated = true;
        this._userService.user = response.user;

        // Persist user settings (scheme) so it survives page refresh
        if (response.userSettings?.scheme) {
            localStorage.setItem('userScheme', response.userSettings.scheme);
        }
    }

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        const emailPayload = { email };
        return this._httpClient.post(
            `${this.apiUrl}/auth/forgot-password`,
            emailPayload
        );
    }

    /**
     * Reset password
     *
     * @param password payload
     */
    resetPassword(passwordPayload: any): Observable<any> {
        return this._httpClient.put(
            `${this.apiUrl}/auth/reset-password`,
            passwordPayload
        );
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        console.log('creds', credentials);
        console.log('this.apiUrl', this.apiUrl);

        return this._httpClient
            .post(`${this.apiUrl}/auth/login`, credentials)
            .pipe(
                switchMap((response: any) => {
                    if (response.newPassword !== true) {
                        this.establishSession(response);
                    }

                    return of(response);
                })
            );
    }

    /**
     * Sign in using the access token (refresh flow).
     * Sends the current token to the backend which issues a fresh one.
     * The backend accepts tokens expired within a 24-hour grace window.
     */
    signInUsingToken(): Observable<boolean> {

        // Renew token
        return this._httpClient
            .post(`${this.apiUrl}/auth/refresh-access-token`, {
                accessToken: this.accessToken
            })
            .pipe(
                catchError(() => {
                    // Refresh failed — return false so callers can handle sign-out
                    return of(false);
                }),
                switchMap((response: any) => {
                    // If the refresh request failed, propagate the failure
                    if (response === false || !response?.token) {
                        return of(false);
                    }

                    // Store the new access token
                    this.accessToken = response.token;

                    // Update the stored user data
                    this.currentUser = JSON.stringify(response.user);

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = response.user;

                    // Persist user settings (scheme) so it survives page refresh
                    if (response.userSettings?.scheme) {
                        localStorage.setItem('userScheme', response.userSettings.scheme);
                    }

                    return of(true);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        console.log('signing out');

        // Remove auth data from local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userScheme');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        // name: string;
        email: string;
        password: string;
        // company: string;
    }): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/register`, user);
    }

    /**
     * Sign up
     *
     * @param userCode object
     */
    confirmUser(code: string): Observable<any> {
        const userCode = {
            confirmCode: code,
        };
        return this._httpClient.post(
            `${this.apiUrl}/auth/confirm-user`,
            userCode
        );
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status.
     * If the token exists (even if expired), attempt a refresh.
     * The backend accepts tokens expired within a 24-hour grace window.
     */
    check(): Observable<boolean> {

        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // If the access token exists, attempt to refresh it.
        // The backend handles the grace window — no need to reject expired tokens client-side.
        return this.signInUsingToken();
    }

    /**
     * Check the Director status
     */
    checkDirector(): Observable<boolean> {
        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        if (AuthUtils.isDirector(this.accessToken)) {
            return of(true);
        }
        else {
            return of(false);
        }
    }

    /**
     * Check the President status (accessLevel >= 3)
     */
    checkPresident(): Observable<boolean> {
        if (!this.accessToken) {
            return of(false);
        }

        return of(AuthUtils.isPresident(this.accessToken));
    }

}
