import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import { map } from 'rxjs/operators';
HC_more(Highcharts);

export interface CommitData {
  data: string [][]; // [[ hash: string ], [author: string], [date: string], [message: string]]
  errors: any []; // [{ type: string, code: string, index: number, row: number, message: string }]
}

@Component({
  selector: 'app-experiment-page',
  templateUrl: './experiment-page.component.html',
  styleUrls: ['./experiment-page.component.css']
})
export class ExperimentPageComponent implements OnInit {
  // TODO - define interface for commit obj
  // Buckets of commits
  // grouped by year
  // ordered array, from latest date to most recent
  dataMap = new Map<number, any []>();
  data: any = [];
  tempData = [];
  updateFromInput = false;

  // Highchart things
  Highcharts = Highcharts;
  chartOptions = {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Commits over Project Life'
    },
    xAxis: {
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Commits'
        }
    },
    tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} Commits</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
    },
    plotOptions: {
        column: {
            pointPadding: 0.2,
            borderWidth: 0
        }
    },
    series: [
      {
        data: this.data
      }
    ]
  };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getFile()
    .pipe(
      map(res => parse(res))
    )
    .subscribe((commitData: CommitData) => {
      this.constructDataSeriesFromCommitData(commitData);
      this.updateFromInput = true;
    });
  }

  private constructDataSeriesFromCommitData(commitData: CommitData): void {
    // Construct data of form [data, value]
    // Value is count of commits in a given week
    // Key of map is the date
    // commitData.data.forEach((data, i) => this.upsertMap(Math.floor(this.findWeekofYearOfDate(Date.parse(data[3])))));
    // this.dataMap.forEach((val: number, key: number) => this.data.push([key, val]));

    commitData.data.forEach((data) => this.upsertMap(data));
    // Take each year, get the week of the year and map it
    this.dataMap.get(2018).forEach(el => this.updateWeekData(this.findWeekofYearOfDate(el[2])));
    // Update data
    this.chartOptions.series[0].data = this.tempData;
  }

  updateWeekData(weekNumber: number): void {
    // Week number - 1
    // Because the array index starts at 0 but the week number starts at 1
    this.tempData[weekNumber - 1] = this.tempData[weekNumber - 1] ? this.tempData[weekNumber - 1] + 1 : 1;
  }

  upsertMap(commit): any [][] {
    const key: number = new Date(commit[2]).getFullYear();
    const res: any [] = this.dataMap.get(key) || [];
    res.push(commit);
    this.dataMap.set(key, res);
    return res;
  }

  private getFile(): Observable<any> {
    return this.http.get('./../../assets/commits.local.csv', { responseType: 'text' });
  }

  private findWeekofYearOfDate(currentDate: string) {
    const lastDateInYearAsNumber = Date.parse('2018-12-21T23:59:59Z');
    const currentDateAsNumber = Date.parse(currentDate);
    // /1000 => convert from milliseconds to seconds
    // /60 => convert from seconds to minutes
    // /60 => convert from minutes to hours
    // /24 => convert from hours to days
    // /7 => convert from days to weeks
    return Math.floor(52 - (lastDateInYearAsNumber - currentDateAsNumber) / 1000 / 60 / 60 / 24 / 7);
  }
}
