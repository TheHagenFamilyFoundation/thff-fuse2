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
    private apiUrl: string;
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
    ) {
        // console.log('auth service constructor');
        // console.log('auth service - environment', environment);
        // if (!environment.production) {
        //     console.log('production env', environment.production);
        //     this.apiUrl = environment.apiUrl;
        // } else {
        //     try {
        //         this.initializeBackendURL().subscribe((url) => {
        //             console.log('url', url);
        //             console.log('initialize backend');
        //             console.log('this.getBackendURL()', this.getBackendURL());
        //             // this.apiUrl = this.getBackendURL();
        //             // console.log('auth-service - this.apiUrl', this.apiUrl);
        //         });
        //     } catch (e) {
        //         console.error(e);
        //     }
        // }
    }

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
                    //debug
                    console.log('auth service - response', response);

                    if (response.newPassword !== true) {

                        // Store the access token in the local storage
                        this.accessToken = response.token;
                        this.currentUser = JSON.stringify(response.user);

                        // Set the authenticated flag to true
                        this._authenticated = true;

                        // // Store the user on the user service
                        this._userService.user = response.user;
                    }

                    // Return a new observable with the response
                    return of(response);
                })
            );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {

        // Renew token
        return this._httpClient
            .post(`${this.apiUrl}/auth/refresh-access-token`, {
                accessToken: this.accessToken
            })
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap((response: any) => {

                    // Store the access token in the local storage
                    this.accessToken = response.token;

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = response.user;

                    // Return true
                    return of(true);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        console.log('signing out');

        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');

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
     * Check the authentication status
     */
    check(): Observable<boolean> {

        console.log('checking');

        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists and it didn't expire, sign in using it
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

    setBackendURL(): void {
        if (environment.production === true) {
            this.apiUrl = sessionStorage.getItem('backend_url');
        } else {
            this.apiUrl = environment.apiUrl;
        }
    }

    getBackendURL(): string {
        return this.apiUrl;
    }

    initializeBackendURL(): Observable<any> {
        console.log('initializing backend');
        if (environment.production === true) {
            console.log(
                'getting backend URL',
                `${window.location.origin}/backend`
            );
            return this._httpClient.get(`${window.location.origin}/backend`);
        } else {
            console.log('production env', environment.production);

            return of(true);
        }
    }

}
