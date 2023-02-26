import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable()
export class GetUserService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();

        console.log('GetUserService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('GetUserService - this.apiUrl', this.apiUrl);
        }
    }

    getUserbyUsername(username: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/user?username=${username}`;

        return this.http.get(urlString);
    }

    getUserbyEmail(email: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/user?email=${email}`;

        return this.http.get(urlString);
    }

    getUserbyID(userID: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/user?id=${userID}`;

        console.log('getUserbyID url - ', urlString);

        return this.http.get(urlString);
    }

    getUsersCount(body: any): Observable<any> {
        this.getBackendURL();

        let urlString = `${this.apiUrl}/users/count`;

        if (body.org) {
            urlString += `?org=${body.org}`; // mongo id
        }

        return this.http.get(urlString);
    }

    getAllUsers(paging: any): Observable<any> {
        this.getBackendURL();

        let urlString = `${this.apiUrl}/user`;

        // console.log('paging limit', paging.limit)
        // console.log('paging skip', paging.skip)

        // if (paging.limit && paging.skip) {
        urlString += `?skip=${paging.skip}&limit=${paging.limit}`;
        // }

        if (paging.org) {
            urlString += `&notorg=${paging.org}`; // mongo id
        }

        console.log('this.urlString', urlString);

        return this.http.get(urlString);
    }

    getDirectors(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/directors`;

        return this.http.get(urlString);
    }

    //possibly move to organization service
    getOrgUsers(orgID: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/orgUsers/${orgID}`;

        return this.http.get(urlString);
    }
}
