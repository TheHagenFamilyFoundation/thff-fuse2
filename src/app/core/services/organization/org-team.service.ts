import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class OrgTeamService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
        }
    }

    addUserToOrganization(orgId: string, email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/organization/${orgId}/users`, { email });
    }

    removeUserFromOrganization(orgId: string, userId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/organization/${orgId}/users/${userId}`);
    }

    getInvites(orgId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/organization/${orgId}/invites`);
    }

    cancelInvite(inviteId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/organization/invites/${inviteId}`);
    }
}
