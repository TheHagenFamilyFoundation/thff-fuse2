import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MeetingService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getMeetings(year?: number, status?: string, showArchived?: string): Observable<any> {
        let params = [];
        if (year) params.push(`year=${year}`);
        if (status) params.push(`status=${status}`);
        if (showArchived) params.push(`showArchived=${showArchived}`);
        const query = params.length ? `?${params.join('&')}` : '';
        return this.http.get(`${this.apiUrl}/meeting${query}`);
    }

    getMeeting(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/meeting/${id}`);
    }

    getMeetingSummary(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/meeting/${id}/summary`);
    }

    getFundedContacts(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/meeting/${id}/funded-contacts`);
    }

    /** Same recipients as grant send (no emails sent) — for confirm dialog. */
    previewGrantEmails(meetingId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/meeting/${meetingId}/preview-grant-emails`);
    }

    /** Re-render full grant email HTML after plain-text message edits (matches send output). */
    renderGrantEmailPreview(
        meetingId: string,
        body: { organizationId: string; messagePlain: string }
    ): Observable<{ html: string }> {
        return this.http.post<{ html: string }>(
            `${this.apiUrl}/meeting/${meetingId}/grant-notification/preview-render`,
            body
        );
    }

    getAddableProposals(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/meeting/${id}/addable-proposals`);
    }

    createMeeting(data: { submissionYear: string; year: number; totalBudget?: number; notes?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/meeting`, data);
    }

    updateMeeting(id: string, data: { totalBudget?: number; status?: string; notes?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/meeting/${id}`, data);
    }

    updateAllocations(id: string, allocations: { _id: string; amountGranted: number }[]): Observable<any> {
        return this.http.put(`${this.apiUrl}/meeting/${id}/allocations`, { allocations });
    }

    addAllocation(id: string, proposalId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/meeting/${id}/allocations/add`, { proposalId });
    }

    completeMeeting(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/meeting/${id}/complete`, {});
    }

    archiveMeeting(id: string, archived: boolean): Observable<any> {
        return this.http.put(`${this.apiUrl}/meeting/${id}/archive`, { archived });
    }

    removeAllocation(meetingId: string, allocationId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/meeting/${meetingId}/allocation/${allocationId}`);
    }
}
