import { NgModule } from '@angular/core';

import { OrganizationModule } from './organization/organization.module';
import { ProfileModule } from './profile/profile.module';
import { SettingsModule } from './settings/settings.module';

@NgModule({
  imports: [

    OrganizationModule,

    ProfileModule,
    SettingsModule,

  ],
  declarations: [],
})
export class PagesModule {

}
