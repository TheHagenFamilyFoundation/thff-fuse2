import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class Get501c3Service {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    // doc501c3 id
    get501c3(id: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization-501c3/${id}`;

        return this.http.get(urlString);
    }

    // Stream the file as a blob for inline viewing
    view501c3(id: string): Observable<Blob> {
        const urlString = `${this.apiUrl}/organization-501c3/${id}/view`;

        return this.http.get(urlString, { responseType: 'blob' });
    }

    get501c3Info(orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/org501c3?orgID=${orgID}`;

        return this.http.get(urlString);
    }
}
