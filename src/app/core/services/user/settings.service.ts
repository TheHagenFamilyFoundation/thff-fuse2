import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Settings } from 'app/core/settings/settings.types';
import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    apiUrl: string;
    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();

        console.log('GetUserService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
            console.log('GetUserService - this.apiUrl', this.apiUrl);
        }
    }

    // maybe make a getUser by ID
    getSettingsByUserID(userID: string): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/settings?userID=${userID}`;

        return this.http.get(urlString);
    }

    // maybe make a getUser by ID
    saveSettings(payload: Settings): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/settings`;

        return this.http.put(urlString, payload);
    }
}
