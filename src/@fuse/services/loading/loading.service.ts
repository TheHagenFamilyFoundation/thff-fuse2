import { Injectable, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, Observable, filter, merge } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FuseLoadingService
{
    private _auto$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private _mode$: BehaviorSubject<'determinate' | 'indeterminate'> = new BehaviorSubject<'determinate' | 'indeterminate'>('indeterminate');
    private _progress$: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(0);
    private _show$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /** Tracks in-flight HTTP requests (Map-per-URL breaks when the same URL overlaps). */
    private _pendingHttpCount = 0;

    /**
     * Constructor
     */
    constructor()
    {
        const router = inject(Router);
        // Clear on navigation lifecycle so the bar does not linger across route changes (logout →
        // sign-in, guard redirects, lazy chunks). NavigationStart runs first and fixes cases where
        // a tracked non-API request or timing left the bar visible before NavigationEnd.
        merge(
            router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)),
            router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
            router.events.pipe(filter((e): e is NavigationCancel => e instanceof NavigationCancel)),
            router.events.pipe(filter((e): e is NavigationError => e instanceof NavigationError))
        ).subscribe(() => this.clearHttpLoadingBar());
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for auto mode
     */
    get auto$(): Observable<boolean>
    {
        return this._auto$.asObservable();
    }

    /**
     * Getter for mode
     */
    get mode$(): Observable<'determinate' | 'indeterminate'>
    {
        return this._mode$.asObservable();
    }

    /**
     * Getter for progress
     */
    get progress$(): Observable<number>
    {
        return this._progress$.asObservable();
    }

    /**
     * Getter for show
     */
    get show$(): Observable<boolean>
    {
        return this._show$.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Show the loading bar
     */
    show(): void
    {
        this._show$.next(true);
    }

    /**
     * Hide the loading bar
     */
    hide(): void
    {
        this.clearHttpLoadingBar();
    }

    /**
     * Resets HTTP-driven loading state (pending count + hide). Safe if nothing was showing.
     */
    clearHttpLoadingBar(): void
    {
        this._pendingHttpCount = 0;
        this._show$.next(false);
    }

    /**
     * Set the auto mode
     *
     * @param value
     */
    setAutoMode(value: boolean): void
    {
        this._auto$.next(value);
    }

    /**
     * Set the mode
     *
     * @param value
     */
    setMode(value: 'determinate' | 'indeterminate'): void
    {
        this._mode$.next(value);
    }

    /**
     * Set the progress of the bar manually
     *
     * @param value
     */
    setProgress(value: number): void
    {
        if ( value < 0 || value > 100 )
        {
            console.error('Progress value must be between 0 and 100!');
            return;
        }

        this._progress$.next(value);
    }

    /**
     * Sets the loading status for one HTTP request (paired start/finalize per intercept).
     *
     * @param status
     * @param _url retained for API compatibility; tracking uses a pending count instead.
     */
    _setLoadingStatus(status: boolean, _url: string): void
    {
        if ( status === true )
        {
            this._pendingHttpCount++;
            if ( this._pendingHttpCount === 1 )
            {
                this._show$.next(true);
            }
            return;
        }

        this._pendingHttpCount = Math.max(0, this._pendingHttpCount - 1);
        if ( this._pendingHttpCount === 0 )
        {
            this._show$.next(false);
        }
    }
}
