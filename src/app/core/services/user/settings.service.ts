import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Settings } from 'app/core/settings/settings.types';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getSettingsByUserID(userID: string): Observable<any> {
        const urlString = `${this.apiUrl}/settings?userID=${userID}`;

        return this.http.get(urlString);
    }

    saveSettings(payload: Settings): Observable<any> {
        const urlString = `${this.apiUrl}/settings`;

        return this.http.put(urlString, payload);
    }
}
