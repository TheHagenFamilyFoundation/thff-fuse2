import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ProposalService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    //get by generated id
    getProposalByID(propID: string): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/propID/${propID}`;

        return this.http.get(urlString);
    }

    //mongo id
    getProposalById(id: string): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/${id}`;

        return this.http.get(urlString);
    }

    //gets all proposals
    getProposals(): Observable<any> {
        const urlString = `${this.apiUrl}/proposal`;

        return this.http.get(urlString);
    }

    //create proposal - submitting
    createProposal(proposal: any, id: any, referralCode?: string): Observable<any> {
        const urlString = `${this.apiUrl}/proposal`;
        const body: any = { proposal, orgID: id };

        if (referralCode) {
            body.referralCode = referralCode;
        }

        return this.http.post(urlString, body);
    }

    //update proposal
    updateProposal(id: string, body: any): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/${id}`;

        return this.http.put(urlString, body);
    }

    getProps(year: number, skip: number, limit: number, filter: string, sortColumn: string, sortDirection: string, showArchived?: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal?year=${year}&skip=${skip}&limit=${limit}`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        //empty string
        if (sortColumn.length !== 0 && sortDirection.length !== 0) {
            urlString += `&sort=${sortColumn}&dir=${sortDirection}`;
        }

        if (showArchived) {
            urlString += `&showArchived=${showArchived}`;
        }

        return this.http.get(urlString);
    }

    getOrgProps(year: number, org: string, skip: number, limit: number, filter: string, sortColumn: string, sortDirection: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal?year=${year}&org=${org}&skip=${skip}&limit=${limit}`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        //empty string
        if (sortColumn.length !== 0 && sortDirection.length !== 0) {
            urlString += `&sort=${sortColumn}&dir=${sortDirection}`;
        }

        return this.http.get(urlString);
    }

    //returns count of proposals in database
    getProposalCount(year: number, filter?: string, showArchived?: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal/count?year=${year}`;

        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        if (showArchived) {
            urlString += `&showArchived=${showArchived}`;
        }

        return this.http.get(urlString);
    }

    getOrgProposalCount(year: number, org: string, filter?: string): Observable<any> {
        let urlString = `${this.apiUrl}/proposal/count?year=${year}&org=${org}`;
        //empty string
        if (filter && filter.trim().length !== 0) {
            urlString += `&filter=${filter}`;
        }

        return this.http.get(urlString);
    }

    //mongo ids
    sponsorProposal(id: string, user: string, toggle: boolean): Observable<any> {

        const urlString = `${this.apiUrl}/proposal/sponsor/${id}`;

        const body = toggle === true ? { sponsor: user } : {};

        return this.http.put(urlString, body);

    }

    // Get proposals for the current user's organizations for the given year
    getMyProposals(year: number): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/my-proposals?year=${year}`;
        return this.http.get(urlString);
    }

    // Archive or unarchive a proposal (president-only)
    archiveProposal(id: string, archived: boolean): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/archive/${id}`;
        return this.http.put(urlString, { archived });
    }

}
