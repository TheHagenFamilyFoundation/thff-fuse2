import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { pagesRoutes } from './page.routing';

@NgModule({
    imports: [RouterModule.forChild(pagesRoutes)],
})
export class PagesModule {}
