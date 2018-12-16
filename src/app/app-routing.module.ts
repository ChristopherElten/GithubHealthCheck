import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepoDashboardComponent } from './repo-dashboard/repo-dashboard.component';
import { ExperimentPageComponent } from './experiment-page/experiment-page.component';

const routes: Routes = [
  { path: ':owner/:repo', component: RepoDashboardComponent },
  { path: 'experiment', component: ExperimentPageComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
