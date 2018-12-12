import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepoDashboardComponent } from './repo-dashboard/repo-dashboard.component';

const routes: Routes = [
  { path: ':owner/:repo', component: RepoDashboardComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
