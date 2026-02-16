import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Validate501c3Service {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  validate501c3(data): Observable<any> {
    return this.http.put(`${this.apiUrl}/validate501c3`, data);
  }
}
