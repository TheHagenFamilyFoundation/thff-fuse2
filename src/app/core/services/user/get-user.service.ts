import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable()
export class GetUserService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getUserbyUsername(username: string): Observable<any> {
        const urlString = `${this.apiUrl}/user?username=${username}`;

        return this.http.get(urlString);
    }

    getUserbyEmail(email: string): Observable<any> {
        const urlString = `${this.apiUrl}/user?email=${email}`;

        return this.http.get(urlString);
    }

    getUserbyID(userID: string): Observable<any> {
        const urlString = `${this.apiUrl}/user?id=${userID}`;

        return this.http.get(urlString);
    }

    getUsersCount(body: any): Observable<any> {
        let urlString = `${this.apiUrl}/users/count`;

        if (body.org) {
            urlString += `?org=${body.org}`; // mongo id
        }

        return this.http.get(urlString);
    }

    getAllUsers(paging: any): Observable<any> {
        let urlString = `${this.apiUrl}/user`;

        urlString += `?skip=${paging.skip}&limit=${paging.limit}`;

        if (paging.org) {
            urlString += `&notorg=${paging.org}`; // mongo id
        }

        return this.http.get(urlString);
    }

    getDirectors(): Observable<any> {
        const urlString = `${this.apiUrl}/directors`;

        return this.http.get(urlString);
    }

    //possibly move to organization service
    getOrgUsers(orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/orgUsers/${orgID}`;

        return this.http.get(urlString);
    }

    updateProfile(payload: { firstName?: string; lastName?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/update-profile`, payload);
    }

    changePassword(payload: { currentPassword: string; newPassword: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/change-password`, payload);
    }
}
