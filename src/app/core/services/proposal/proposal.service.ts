import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class ProposalService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();

        console.log('ProposalService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('ProposalService - this.apiUrl', this.apiUrl);
        }
    }

    //get by generated id
    getProposalByID(propID: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal/propID/${propID}`;

        return this.http.get(urlString);
    }

    //mongo id
    getProposalById(id: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal/${id}`;

        return this.http.get(urlString);
    }

    //gets all proposals
    getProposals(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal`;

        return this.http.get(urlString);
    }

    //create proposal - submitting
    createProposal(proposal: any, id: any): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal`;

        return this.http.post(urlString, { proposal, orgID: id });
    }

    //update proposal
    updateProposal(id: string, body: any): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal/${id}`;

        return this.http.put(urlString, body);
    }


    //TODO: pass in sort
    getProps(skip: number, limit: number, filter: string, sortColumn: string, sortDirection: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal?skip=${skip}&limit=${limit}`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        //empty string
        if (sortColumn.length !== 0 && sortDirection.length !== 0) {
            urlString += `&sort=${sortColumn}&dir=${sortDirection}`;
        }

        console.log('urlString', urlString);

        return this.http.get(urlString);
    }

    //returns count of proposals in database
    getProposalCount(filter?: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal/count`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `?filter=${filter}`;
        }

        return this.http.get(urlString);
    }

    //mongo ids
    sponsorProposal(id: string, user: string, toggle: boolean): Observable<any> {

        const urlString = `${this.apiUrl}/proposal/sponsor/${id}`;

        const body = toggle === true ? { sponsor: user } : {};

        return this.http.put(urlString, body);

    }

}
