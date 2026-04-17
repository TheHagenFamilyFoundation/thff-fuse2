import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class Upload501c3Service {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    // file from event.target.files[0]
    upload501c3(file: File, orgID: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization-501c3/${orgID}`;

        const formData = new FormData();
        formData.append('doc501c3', file);

        const params = new HttpParams();

        const options = {
            params,
            reportProgress: true,
        };

        const req = new HttpRequest('POST', urlString, formData, options);

        return this.http.request(req);
    }
}
