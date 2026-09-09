import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Resolve,
    RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Kept for route compatibility. Fuse demo shell data (messages, notifications,
 * shortcuts, quick-chat, mock navigation) is no longer loaded.
 */
@Injectable({
    providedIn: 'root',
})
export class InitialDataResolver implements Resolve<boolean> {
    resolve(
        _route: ActivatedRouteSnapshot,
        _state: RouterStateSnapshot
    ): Observable<boolean> {
        return of(true);
    }
}
