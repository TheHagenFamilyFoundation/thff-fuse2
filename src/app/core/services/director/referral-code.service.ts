import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReferralCodeService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    createReferralCode(label?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/referral-code`, { label });
    }

    getMyReferralCodes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/referral-code`);
    }

    toggleReferralCode(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/referral-code/${id}/toggle`, {});
    }

    validateReferralCode(code: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/referral-code/validate/${code}`);
    }

    getMySponsor(): Observable<any> {
        return this.http.get(`${this.apiUrl}/referral-code/my-sponsor`);
    }

    setMyReferralCode(code: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/referral-code/my-sponsor`, { code });
    }

    clearMyReferralCode(): Observable<any> {
        return this.http.put(`${this.apiUrl}/referral-code/my-sponsor`, {});
    }
}
