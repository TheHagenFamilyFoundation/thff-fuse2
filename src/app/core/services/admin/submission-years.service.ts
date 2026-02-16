import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SubmissionYearsService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getAllSubmissionYears(year: number): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year?year=${year}`;

        return this.http.get(urlString);
    }

    //get single submission year
    getSubmissionYear(submissionYearId: string): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/${submissionYearId}`;

        return this.http.get(urlString);
    }

    //get current submission year
    getCurrentSubmissionYear(): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/current`;

        return this.http.get(urlString);
    }

    //get latest submission year (most recent year, not necessarily current calendar year)
    getLatestSubmissionYear(): Observable<any> {
        const currentYear = new Date().getFullYear();
        const urlString = `${this.apiUrl}/submission-year?year=${currentYear}`;

        // The backend returns all submission years sorted by most recent, but we'll sort again to ensure we get the latest
        return this.http.get<any[]>(urlString).pipe(
            map((years) => {
                if (!years || years.length === 0) {
                    return null;
                }

                // Sort by year descending (highest year first) to ensure we get the latest
                const sortedYears = [...years].sort((a, b) => {
                    const yearA = a?.year || 0;
                    const yearB = b?.year || 0;
                    return yearB - yearA; // Descending order (2026, 2025, 2024, etc.)
                });

                const latestYear = sortedYears[0];

                return latestYear;
            })
        );
    }

    //toggle portal
    toggleSubmissionYear(submissionYearId: string, toggle: boolean): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/toggle`;
        const body = {
            _id: submissionYearId,
            active: toggle
        };

        return this.http.put(urlString, body);
    }

    //create submission year
    createSubmissionYear(year: number = new Date().getFullYear()): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/`;
        const body = {
            year
        };

        return this.http.post(urlString, body);
    }

    //returns count of submission years in database
    getSubmissionYearCount(): Observable<any> {
        const urlString = `${this.apiUrl}/submission-year/count`;

        return this.http.get(urlString);
    }

}
