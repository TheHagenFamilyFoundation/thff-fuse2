import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
