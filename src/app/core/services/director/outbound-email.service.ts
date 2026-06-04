import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OutboundEmailService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getMySolicitationEmails(
        referralCodeId?: string,
        page = 1,
        pageSize = 10,
        /** Submission cycle year (matches referral code creation year). */
        year?: string
    ): Observable<{ items: any[]; total: number; page: number; pageSize: number }> {
        let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
        if (referralCodeId) {
            params = params.set('referralCodeId', referralCodeId);
        }
        if (year) {
            params = params.set('year', year);
        }
        return this.http.get<{ items: any[]; total: number; page: number; pageSize: number }>(
            `${this.apiUrl}/outbound-email/solicitations`,
            { params }
        );
    }

    /** Full document including htmlBody (for view preview). */
    getSolicitationEmailById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/outbound-email/solicitations/${id}`);
    }

    previewSolicitation(body: {
        referralCodeId: string;
        /** Omit to use the server default body text. */
        messagePlain?: string;
    }): Observable<{ subject: string; html: string; plainText: string }> {
        return this.http.post<{ subject: string; html: string; plainText: string }>(
            `${this.apiUrl}/outbound-email/solicitation/preview`,
            body
        );
    }

    sendSolicitationEmail(body: {
        referralCodeId: string;
        to: string;
        messagePlain?: string;
    }): Observable<any> {
        return this.http.post(`${this.apiUrl}/outbound-email/solicitation`, body);
    }

    resendSolicitationEmail(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/outbound-email/solicitation/${id}/resend`, {});
    }

    getMeetingGrantEmails(
        meetingId: string,
        page = 1,
        pageSize = 10
    ): Observable<{ items: any[]; total: number; page: number; pageSize: number }> {
        const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
        return this.http.get<{ items: any[]; total: number; page: number; pageSize: number }>(
            `${this.apiUrl}/meeting/${meetingId}/outbound-emails`,
            { params }
        );
    }

    getGrantEmailProposals(meetingId: string): Observable<{
        meeting?: { _id?: string; year?: number };
        proposals?: unknown[];
        counts?: { ready: number; skipped: number };
    }> {
        return this.http.get(`${this.apiUrl}/meeting/${meetingId}/grant-email-proposals`);
    }

    /** Single grant notification including htmlBody (must belong to the meeting). */
    getMeetingGrantEmailById(meetingId: string, emailId: string): Observable<{
        subject?: string;
        to?: string;
        htmlBody?: string | null;
        createdAt?: string;
        organizationName?: string;
        proposalTitle?: string;
    }> {
        return this.http.get(`${this.apiUrl}/meeting/${meetingId}/outbound-emails/${emailId}`);
    }

    sendGrantNotifications(
        meetingId: string,
        body?: {
            /** When provided, only send to these funded allocation ids (one per proposal). */
            allocationIds?: string[];
            /** Legacy: filter by organization id. */
            organizationIds?: string[];
            customizations?: Array<{
                allocationId?: string;
                organizationId?: string;
                subject: string;
                messagePlain: string;
            }>;
        }
    ): Observable<any> {
        return this.http.post(`${this.apiUrl}/meeting/${meetingId}/send-grant-notifications`, body ?? {});
    }
}
