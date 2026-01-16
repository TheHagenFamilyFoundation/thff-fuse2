import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { WelcomeComponent } from 'app/modules/welcome/welcome.component';

const welcomeRoutes: Route[] = [
    {
        path: '',
        component: WelcomeComponent,
    },
];

@NgModule({
    declarations: [WelcomeComponent],
    imports: [
        RouterModule.forChild(welcomeRoutes),
        SharedModule
    ],
})
export class WelcomeModule {}
