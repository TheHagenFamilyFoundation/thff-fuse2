import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Resolve,
    RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { ProposalService } from './proposal.service';

@Injectable({
    providedIn: 'root',
})
export class ProposalResolver implements Resolve<any> {
    /**
     * Constructor
     */
    constructor(private _proposalService: ProposalService) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {
        return this._proposalService.getData();
    }
}
