import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
@Component({
    selector: 'app-not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent implements OnInit {
    title = 'Routing...';

    constructor(private _router: Router, private _location: Location) {}

    ngOnInit(): void {
        setTimeout(() => {
            // TODO: fix this hack?
            // this._router.navigate(['/']);
            // this._location.back();
            // console.log('this._location', this._location.path);
            // this._location.;
            // this._router.navigate(['/']);
            window.location.reload();
        }, 2000); //2s
    }
}
