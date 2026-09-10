import { NgModule } from '@angular/core';
import { LayoutComponent } from 'app/layout/layout.component';
import { EmptyLayoutModule } from 'app/layout/layouts/empty/empty.module';
import { ModernLayoutModule } from 'app/layout/layouts/horizontal/modern/modern.module';
import { SharedModule } from 'app/shared/shared.module';

const layoutModules = [
    EmptyLayoutModule,
    ModernLayoutModule,
];

@NgModule({
    declarations: [
        LayoutComponent
    ],
    imports     : [
        SharedModule,
        ...layoutModules
    ],
    exports     : [
        LayoutComponent,
        ...layoutModules
    ]
})
export class LayoutModule
{
}
