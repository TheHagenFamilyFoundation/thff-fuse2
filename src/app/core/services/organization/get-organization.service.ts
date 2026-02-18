import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable()
export class GetOrganizationService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    // get Organization by director
    getOrgbyDirector(username: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization?director=${username}`;

        return this.http.get(urlString);
    }

    getOrgbyName(name: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization?name=${name}`;

        return this.http.get(urlString);
    }

    getOrgbyID(orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization/orgID/${orgID}`;

        return this.http.get(urlString);
    }

    getOrg(id: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization/${id}`;

        return this.http.get(urlString);
    }

    //TODO: old
    // want to remove
    getAllOrgs(): Observable<any> {
        const urlString = `${this.apiUrl}/organization?limit=1000`;

        return this.http.get(urlString);
    }

    //TODO: pass in sort
    getOrgs(skip: number, limit: number, filter: string, sortColumn: string, sortDirection: string, year?: number): Observable<any> {
        let urlString = `${this.apiUrl}/organization?skip=${skip}&limit=${limit}`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        //empty string
        if (sortColumn.length !== 0 && sortDirection.length !== 0) {
            urlString += `&sort=${sortColumn}&dir=${sortDirection}`;
        }

        if (year) {
            urlString += `&year=${year}`;
        }

        return this.http.get(urlString);
    }

    //returns count of organizations in database
    getOrganizationCount(filter?: string, year?: number): Observable<any> {
        let urlString = `${this.apiUrl}/organization/count`;
        const params: string[] = [];

        if (filter && filter.trim().length !== 0) {
            params.push(`filter=${filter}`);
        }

        if (year) {
            params.push(`year=${year}`);
        }

        if (params.length > 0) {
            urlString += '?' + params.join('&');
        }

        return this.http.get(urlString);
    }
}
