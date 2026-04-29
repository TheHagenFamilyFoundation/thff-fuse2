import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { FuseLoadingService } from '@fuse/services/loading/loading.service';

@Injectable()
export class FuseLoadingInterceptor implements HttpInterceptor
{
    handleRequestsAutomatically: boolean;

    /**
     * Constructor
     */
    constructor(
        private _fuseLoadingService: FuseLoadingService
    )
    {
        // Subscribe to the auto
        this._fuseLoadingService.auto$
            .subscribe((value) => {
                this.handleRequestsAutomatically = value;
            });
    }

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        // If the Auto mode is turned off, do nothing
        if ( !this.handleRequestsAutomatically )
        {
            return next.handle(req);
        }

        const trackLoading = !this._shouldSkipLoadingBar(req.url);

        if ( trackLoading )
        {
            this._fuseLoadingService._setLoadingStatus(true, req.url);
        }

        return next.handle(req).pipe(
            finalize(() => {
                if ( trackLoading )
                {
                    this._fuseLoadingService._setLoadingStatus(false, req.url);
                }
            }));
    }

    /**
     * Avoid flicker from background traffic: static assets, i18n, health checks.
     */
    private _shouldSkipLoadingBar(url: string): boolean
    {
        const u = url.toLowerCase();
        if (
            u.includes('/assets/') ||
            u.includes('assets/i18n') ||
            u.includes('/i18n/') ||
            u.includes('/health') ||
            u.endsWith('/health')
        )
        {
            return true;
        }

        const pathname = this._requestPathname(url);
        // Same-origin dev proxy: always skip `/api` regardless of how the URL was string-built
        // (e.g. `api/foo` without a leading slash would otherwise miss `environment.apiUrl` checks).
        if ( pathname === '/api' || pathname.startsWith('/api/') )
        {
            return true;
        }

        // App backend: do not tie the global bar to API calls — they can hang for a long time if the
        // server is down, leaving the bar stuck; screens use their own loading states where needed.
        const api = environment?.apiUrl;
        if ( api )
        {
            const apiLower = api.toLowerCase();
            if ( apiLower.startsWith('http') && u.toLowerCase().startsWith(apiLower) )
            {
                return true;
            }
            // Dev proxy: `apiUrl` is same-origin path (e.g. `/api`), `req.url` is absolute to :4200
            if ( api.startsWith('/') && (pathname === api || pathname.startsWith(`${api}/`)) )
            {
                return true;
            }
        }

        return false;
    }

    /** Pathname for skip rules; normalizes relative URLs so `api/x` → `/api/x`. */
    private _requestPathname(url: string): string
    {
        try
        {
            const raw = (url.split('?')[0] || '').trim();
            if ( !raw )
            {
                return '/';
            }
            if ( raw.includes('://') )
            {
                return new URL(raw).pathname || '/';
            }
            return raw.startsWith('/') ? raw : `/${raw}`;
        }
        catch
        {
            return '/';
        }
    }
}
