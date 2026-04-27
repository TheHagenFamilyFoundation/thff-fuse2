import { Component, ViewEncapsulation } from '@angular/core';

@Component({
    standalone: false,
    selector     : 'example',
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ExampleComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
