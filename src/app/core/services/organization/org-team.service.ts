import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OrgTeamService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    addUserToOrganization(orgId: string, email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/organization/${orgId}/users`, { email });
    }

    removeUserFromOrganization(orgId: string, userId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/organization/${orgId}/users/${userId}`);
    }

    getInvites(orgId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/organization/${orgId}/invites`);
    }

    resendInvite(inviteId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/organization/invites/${inviteId}/resend`, {});
    }

    cancelInvite(inviteId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/organization/invites/${inviteId}`);
    }
}
