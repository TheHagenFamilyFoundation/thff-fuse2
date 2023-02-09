import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { WelcomeComponent } from 'app/modules/welcome/welcome.component';

const welcomeRoutes: Route[] = [
    {
        path: '',
        component: WelcomeComponent,
    },
];

@NgModule({
    declarations: [WelcomeComponent],
    imports: [RouterModule.forChild(welcomeRoutes)],
})
export class WelcomeModule {}
