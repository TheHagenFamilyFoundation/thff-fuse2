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

    getMeetingGrantEmails(meetingId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/meeting/${meetingId}/outbound-emails`);
    }

    sendGrantNotifications(meetingId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/meeting/${meetingId}/send-grant-notifications`, {});
    }
}
