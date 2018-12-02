import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepoDashboardComponent } from './repo-dashboard/repo-dashboard.component';

const routes: Routes = [
  { path: 'ngTest', component: RepoDashboardComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
