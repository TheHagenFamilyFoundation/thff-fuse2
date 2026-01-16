import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class SubmissionYearsService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();

        console.log('SubmissionYearsService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('SubmissionYearsService - this.apiUrl', this.apiUrl);
        }
    }

    getAllSubmissionYears(year: number): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/submission-year?year=${year}`;

        console.log('this.urlString', urlString);

        return this.http.get(urlString);
    }

    //get single submission year
    getSubmissionYear(submissionYearId: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/submission-year/${submissionYearId}`;

        console.log('this.urlString', urlString);

        return this.http.get(urlString);
    }

    //get current submission year
    getCurrentSubmissionYear(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/submission-year/current`;

        console.log('this.urlString', urlString);

        return this.http.get(urlString);
    }

    //get latest submission year (most recent year, not necessarily current calendar year)
    getLatestSubmissionYear(): Observable<any> {
        this.getBackendURL();

        const currentYear = new Date().getFullYear();
        const urlString = `${this.apiUrl}/submission-year?year=${currentYear}`;

        console.log('getLatestSubmissionYear - urlString', urlString);

        // The backend returns all submission years sorted by most recent, but we'll sort again to ensure we get the latest
        return this.http.get<any[]>(urlString).pipe(
            map((years) => {
                console.log('getLatestSubmissionYear - all years received:', years);

                if (!years || years.length === 0) {
                    console.log('getLatestSubmissionYear - no years found');
                    return null;
                }

                // Sort by year descending (highest year first) to ensure we get the latest
                const sortedYears = [...years].sort((a, b) => {
                    const yearA = a?.year || 0;
                    const yearB = b?.year || 0;
                    return yearB - yearA; // Descending order (2026, 2025, 2024, etc.)
                });

                const latestYear = sortedYears[0];
                console.log('getLatestSubmissionYear - sorted years:', sortedYears);
                console.log('getLatestSubmissionYear - latest year selected:', latestYear);

                return latestYear;
            })
        );
    }

    //toggle portal
    toggleSubmissionYear(submissionYearId: string, toggle: boolean): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/submission-year/toggle`;
        const body = {
            _id: submissionYearId,
            active: toggle
        };
        console.log('this.urlString', urlString);

        return this.http.put(urlString, body);
    }

    //create submission year
    createSubmissionYear(year: number = new Date().getFullYear()): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/submission-year/`;
        const body = {
            year
        };
        console.log('this.urlString', urlString);

        return this.http.post(urlString, body);
    }

    //returns count of submission years in database
    getSubmissionYearCount(): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/count`;

        return this.http.get(urlString);
    }

}
