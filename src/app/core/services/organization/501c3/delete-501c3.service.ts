import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class Delete501c3Service {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    delete501c3(id: string): Observable<any> {
        const urlString = `${this.apiUrl}/organization-501c3/${id}`;

        return this.http.delete(urlString);
    }
}
