import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-director',
    templateUrl: './director.component.html',
    styleUrls: ['./director.component.scss']
})
export class DirectorComponent implements OnInit {

    constructor(private _router: Router) {}

    ngOnInit(): void {}

    goToOrganizations(): void {
        this._router.navigate(['/pages/director/organizations']);
    }

    goToProposals(): void {
        this._router.navigate(['/pages/director/proposals']);
    }

    goToVoting(): void {
        this._router.navigate(['/pages/director/voting']);
    }

    goToSubmissionYears(): void {
        this._router.navigate(['/pages/director/submission-years']);
    }
}
