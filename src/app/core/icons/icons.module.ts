import { NgModule } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

@NgModule()
export class IconsModule
{
    /**
     * Constructor
     */
    constructor(
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry
    )
    {
        // Heroicons only — material / iconsmind / feather sprites were unused by the modern UI
        // and added several MB to the deploy artifact.
        this._matIconRegistry.addSvgIconSetInNamespace('heroicons_outline', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-outline.svg'));
        this._matIconRegistry.addSvgIconSetInNamespace('heroicons_solid', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-solid.svg'));
    }
}
