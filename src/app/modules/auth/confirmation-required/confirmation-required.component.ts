import { Component, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'auth-confirmation-required',
    templateUrl: './confirmation-required.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class AuthConfirmationRequiredComponent {
    fullImagePath = '../assets/images/logo/logo_2020_9.svg';

    /**
     * Constructor
     */
    constructor() {}
}
