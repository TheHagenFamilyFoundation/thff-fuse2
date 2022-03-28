import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'auth-confirmation',
    templateUrl: './confirmation.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthConfirmationComponent implements OnInit {
    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    confirmCode: string;

    /**
     * Constructor
     */
    constructor(private _router: Router, private route: ActivatedRoute) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.confirmCode = params.cc; // (+) converts string 'id' to a number

            //TODO: delete
            console.log('this.confirmCode');
            console.log(this.confirmCode);
        });
    }
}
