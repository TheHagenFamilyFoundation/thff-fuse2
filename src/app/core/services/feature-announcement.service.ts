import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from 'environments/environment';
import { FeatureAnnouncement } from 'app/core/announcements/feature-announcements';

const SEEN_KEY = 'thff-seen-announcement-keys';

@Injectable({
    providedIn: 'root',
})
export class FeatureAnnouncementService {
    private _updates = new Subject<void>();

    /** Fires after a notice is added or removed, so the header bell can reload. */
    readonly updates$ = this._updates.asObservable();

    constructor(private _http: HttpClient) {}

    seenKeys(): Set<string> {
        try {
            const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
            return new Set(Array.isArray(raw) ? raw.filter((key) => typeof key === 'string') : []);
        } catch {
            return new Set();
        }
    }

    markSeen(keys: string[]): void {
        const next = this.seenKeys();
        keys.forEach((key) => next.add(key));
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    }

    /**
     * Active notices. Local builds also ask for ones that have not started yet,
     * so the January notice can be reviewed before its public date.
     * Production ignores that flag.
     */
    getActive(): Observable<FeatureAnnouncement[]> {
        const preview = environment.production ? '' : '?preview=1';
        return this._http.get<FeatureAnnouncement[]>(
            `${environment.apiUrl}/feature-announcement${preview}`,
        );
    }

    manage(): Observable<{
        notices: Array<FeatureAnnouncement & { startsOn: string; endsOn: string; audience: string }>;
    }> {
        return this._http.get<{
            notices: Array<FeatureAnnouncement & { startsOn: string; endsOn: string; audience: string }>;
        }>(`${environment.apiUrl}/feature-announcement/manage`);
    }

    recipientCount(): Observable<{ total: number }> {
        return this._http.get<{ total: number }>(
            `${environment.apiUrl}/feature-announcement/recipient-count`,
        );
    }

    searchRecipients(q: string): Observable<{
        users: Array<{ id: string; email: string; name: string; role: string; organizations: string[] }>;
    }> {
        return this._http.get<{
            users: Array<{ id: string; email: string; name: string; role: string; organizations: string[] }>;
        }>(`${environment.apiUrl}/feature-announcement/recipients`, { params: { q } });
    }

    send(payload: {
        title: string;
        body: string;
        link?: string;
        linkLabel?: string;
        bell: boolean;
        email: boolean;
        allEmails?: boolean;
        recipients?: string[];
        endsOn?: string;
    }): Observable<{ bell: FeatureAnnouncement | null; bellRecipientCount: number; emailQueued: number }> {
        return this._http.post<{ bell: FeatureAnnouncement | null; bellRecipientCount: number; emailQueued: number }>(
            `${environment.apiUrl}/feature-announcement/send`,
            payload,
        ).pipe(
            tap((res) => {
                if (res?.bell) {
                    this._updates.next();
                }
            }),
        );
    }

    schedule(): Observable<{
        year: number;
        projected: boolean;
        jobEnabled: boolean;
        notices: Array<{
            key: string;
            title: string;
            audience: string;
            subject: string;
            summary: string;
            sendsOn: string;
            sentAt: string | null;
        }>;
    }> {
        return this._http.get<{
            year: number;
            projected: boolean;
            jobEnabled: boolean;
            notices: Array<{
                key: string;
                title: string;
                audience: string;
                subject: string;
                summary: string;
                sendsOn: string;
                sentAt: string | null;
            }>;
        }>(`${environment.apiUrl}/feature-announcement/schedule`);
    }

    saveSchedule(dates: { portalOpenOn: string; twoWeeksOn: string; weekOfOn: string }): Observable<{
        year: number;
        projected: boolean;
        jobEnabled: boolean;
        notices: Array<{
            key: string;
            title: string;
            audience: string;
            subject: string;
            summary: string;
            sendsOn: string;
            sentAt: string | null;
        }>;
    }> {
        return this._http.put<{
            year: number;
            projected: boolean;
            jobEnabled: boolean;
            notices: Array<{
                key: string;
                title: string;
                audience: string;
                subject: string;
                summary: string;
                sendsOn: string;
                sentAt: string | null;
            }>;
        }>(`${environment.apiUrl}/feature-announcement/schedule`, dates);
    }

    remove(id: string): Observable<{ deleted: boolean }> {
        return this._http.delete<{ deleted: boolean }>(
            `${environment.apiUrl}/feature-announcement/${id}`,
        ).pipe(
            tap(() => this._updates.next()),
        );
    }
}
