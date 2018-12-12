import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { AppRoutingModule } from './/app-routing.module';
import { RepoDashboardComponent } from './repo-dashboard/repo-dashboard.component';
import { FileVolatilityComponent } from './file-volatility/file-volatility.component';

@NgModule({
  declarations: [
    AppComponent,
    RepoDashboardComponent,
    FileVolatilityComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HighchartsChartModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
