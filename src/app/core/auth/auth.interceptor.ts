import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private _isRefreshing = false;
    private _refreshSubject: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null);

    constructor(private _authService: AuthService, private _router: Router) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // Public endpoints must work without a session (e.g. home page grant-cycle status).
        const newReq = this._isPublicEndpoint(req.url) ? req : this._addToken(req);

        // Response
        return next.handle(newReq).pipe(
            catchError((error) => {
                // Catch "401 Unauthorized" responses
                if (
                    error instanceof HttpErrorResponse &&
                    error.status === 401
                ) {
                    // Don't intercept auth endpoints (prevent refresh loops)
                    const skipEndpoints = ['/auth/'];
                    const isSkipEndpoint = skipEndpoints.some(endpoint =>
                        req.url.includes(endpoint)
                    );

                    if (isSkipEndpoint || this._isPublicEndpoint(req.url)) {
                        return throwError(() => error);
                    }

                    // Attempt to refresh the token before giving up
                    return this._handle401(req, next);
                }

                return throwError(() => error);
            })
        );
    }

    /** Endpoints that must not require auth (landing page grant-cycle status, health checks). */
    private _isPublicEndpoint(url: string): boolean {
        const publicEndpoints = ['/submission-year', '/health'];
        return publicEndpoints.some((endpoint) => url.includes(endpoint));
    }

    /**
     * Attach the access token to the request header.
     */
    private _addToken(req: HttpRequest<any>): HttpRequest<any> {
        const token = this._authService.accessToken;
        if (token) {
            return req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + token),
            });
        }
        return req;
    }

    /**
     * Handle 401 by refreshing the token once, then retrying the original request.
     * If a refresh is already in progress, queue the request until it completes.
     */
    private _handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this._isRefreshing) {
            this._isRefreshing = true;
            this._refreshSubject.next(null);

            return this._authService.signInUsingToken().pipe(
                switchMap((success: boolean) => {
                    this._isRefreshing = false;

                    if (success) {
                        this._refreshSubject.next(true);
                        // Retry the original request with the new token
                        return next.handle(this._addToken(req));
                    }

                    // Refresh failed — sign out
                    this._refreshSubject.next(false);
                    this._authService.signOut();
                    this._router.navigate(['/sign-out']);
                    return throwError(() => new Error('Session expired'));
                }),
                catchError(() => {
                    this._isRefreshing = false;
                    this._refreshSubject.next(false);
                    this._authService.signOut();
                    this._router.navigate(['/sign-out']);
                    return throwError(() => new Error('Session expired'));
                })
            );
        }

        // A refresh is already in progress — wait for it to complete then retry
        return this._refreshSubject.pipe(
            filter((result) => result !== null),
            take(1),
            switchMap((success) => {
                if (success) {
                    return next.handle(this._addToken(req));
                }
                return throwError(() => new Error('Session expired'));
            })
        );
    }
}
