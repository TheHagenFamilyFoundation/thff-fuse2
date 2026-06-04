import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

    /**
     * Create a proposal. Pass `{ status: 'draft' }` for an in-progress composer row (no submission email);
     * the API will set `draft` vs `ready_to_submit` from field completeness. Omit status for final submit.
     */
    createProposal(
        proposal: any,
        orgMongoId: any,
        referralCode?: string,
        options?: { status?: 'draft' | 'submitted' },
    ): Observable<any> {
        const urlString = `${this.apiUrl}/proposal`;
        const body: any = { proposal, orgID: orgMongoId };

        if (referralCode) {
            body.referralCode = referralCode;
        }
        if (options?.status) {
            body.status = options.status;
        }

        return this.http.post(urlString, body);
    }

    /**
     * Whether the signed-in user has any proposal tied to their organizations (any year, draft or submitted).
     * GET /proposal/my-proposals-exists — optional; nav no longer depends on this.
     */
    applicantHasAnyMyProposalContent$(): Observable<boolean> {
        const url = `${this.apiUrl}/proposal/my-proposals-exists`;
        return this.http.get<{ hasAny?: boolean }>(url).pipe(
            map((r) => !!r?.hasAny),
            catchError(() => of(false)),
        );
    }

    /** Draft proposals for the signed-in user; optional `organization` = org Mongo `_id` to scope one org. */
    getMyDrafts(organizationMongoId?: string): Observable<any[]> {
        let url = `${this.apiUrl}/proposal/my-drafts`;
        if (organizationMongoId) {
            url += `?organization=${encodeURIComponent(organizationMongoId)}`;
        }
        return this.http.get<any[]>(url);
    }

    //update proposal
    updateProposal(id: string, body: any): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/${id}`;

        return this.http.put(urlString, body);
    }

    getProps(
        year: number,
        skip: number,
        limit: number,
        filter: string,
        sortColumn: string,
        sortDirection: string,
        showArchived?: string,
        /** When true, API returns `{ items, total }` (one round trip vs separate /count). */
        includeTotal?: boolean
    ): Observable<any> {
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

        if (includeTotal) {
            urlString += '&includeTotal=1';
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

    /** Delete an in-progress composer proposal (draft / ready_to_submit). Applicant org members only. */
    deleteMyProposal(mongoId: string): Observable<void> {
        const urlString = `${this.apiUrl}/proposal/${mongoId}`;
        return this.http.delete<void>(urlString);
    }

    // Archive or unarchive a proposal (president-only)
    archiveProposal(id: string, archived: boolean): Observable<any> {
        const urlString = `${this.apiUrl}/proposal/archive/${id}`;
        return this.http.put(urlString, { archived });
    }

}
