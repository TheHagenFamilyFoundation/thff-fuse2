import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { OrganizationService } from './organization.service';

@Injectable({
    providedIn: 'root'
})
export class OrganizationResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _organizationService: OrganizationService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._organizationService.getData();
    }
}
