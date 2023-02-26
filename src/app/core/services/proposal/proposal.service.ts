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
    getProposalByID(proposalID: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal?proposalID=${proposalID}`;

        return this.http.get(urlString);
    }

    //mongo id
    getProposalById(id: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal?id=${id}`;

        return this.http.get(urlString);
    }

    //gets all proposals
    getProposals(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal`;

        return this.http.get(urlString);
    }

    //create proposal - submitting
    createProposal(proposal: any): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal`;

        return this.http.post(urlString, proposal);
    }
    //update proposal
    updateProposal(proposalID: string, body: any): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/proposal?proposalID=${proposalID}`;

        return this.http.patch(urlString, body);
    }
}
