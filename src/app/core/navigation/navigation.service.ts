import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Navigation } from 'app/core/navigation/navigation.types';

const EMPTY_NAVIGATION: Navigation = {
    compact: [],
    default: [],
    futuristic: [],
    horizontal: [],
};

@Injectable({
    providedIn: 'root'
})
export class NavigationService
{
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    /**
     * Provide empty navigation locally (Fuse mock navigation API removed).
     * Modern layout uses hardcoded top-nav links instead of fuse-navigation.
     */
    get(): Observable<Navigation>
    {
        return of(EMPTY_NAVIGATION).pipe(
            tap((navigation) => {
                this._navigation.next(navigation);
            })
        );
    }
}
