import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, BehaviorSubject, tap } from 'rxjs';
import { User } from 'app/core/user/user.types';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        console.log('user-service - setting user', value);

        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current logged in user data
     */
    get(): Observable<User> {
        // const getAttempt = this._httpClient.get<User>('api/common/user').pipe(
        //     tap((user) => {
        //         this._user.next(user);
        //     })
        // );

        // console.log(typeof getAttempt);
        // console.log(getAttempt);

        // return this._httpClient.get<User>('api/common/user').pipe(
        //     tap((user) => {
        //         this._user.next(user);
        //     })
        // );

        // // console.log(this._user);
        // // // console.log(this.user$);

        // console.log('returning user');

        // return this._user;

        // console.log('user$', this.user$);

        const currentUserSubject = new BehaviorSubject<User>(
            JSON.parse(localStorage.getItem('currentUser'))
        );

        // console.log('currentUserSubject', currentUserSubject);

        const currentUser = currentUserSubject.asObservable();

        // console.log('returning currentUser', currentUser);

        return currentUser;
    }

    // //getUser
    // get(): User {
    //     console.log('getting user', JSON.parse(localStorage.getItem('currentUser')));
    //     return JSON.parse(localStorage.getItem('currentUser'));
    // }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._httpClient.patch<User>('api/common/user', { user }).pipe(
            map((response) => {
                this._user.next(response);
            })
        );
    }
}
