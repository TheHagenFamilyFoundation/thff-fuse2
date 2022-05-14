import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class InOrgService {
    public inOrgSource = new BehaviorSubject(false);

    currentInOrg = this.inOrgSource.asObservable();

    constructor() {}

    changeMessage(inOrg: boolean): any {
        this.inOrgSource.next(inOrg);
    }
}
