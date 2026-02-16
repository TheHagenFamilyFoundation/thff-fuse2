import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DirectorService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    vote(data: any): Observable<any> {
        const urlString = `${this.apiUrl}/vote`;

        return this.http.post(urlString, data);
    }
}
