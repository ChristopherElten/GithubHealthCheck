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

export interface YearlyDataOverviewObject {
  message: string;
  commitKeysMap: Map<string, number>;
}

@Component({
  selector: 'app-experiment-page',
  templateUrl: './experiment-page.component.html',
  styleUrls: ['./experiment-page.component.css']
})
export class ExperimentPageComponent implements OnInit {
  // yearlyDataOverviewObject to display in dashboard
  yearlyDataOverviewObjects: YearlyDataOverviewObject [] = [];
  commitSet = new Set<string>();

  // TODO - define interface for commit obj
  // Buckets of commits
  // grouped by year
  // ordered array, from latest date to most recent
  dataMap = new Map<number, any []>();
  tempData = this.getEmptyArrForYearByWeek();
  updateFromInput = false;

  // Highchart things
  Highcharts = Highcharts;
  chart: any;
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
    series: []
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
    commitData.data.forEach((data) => this.upsertArrMap(data));
    // Take each year, get the week of the year and map it
    this.dataMap.forEach((yearData: any [], key: number) => {
      const commitMessageKeysMap = new Map<string, number>();
      yearData.forEach(el => {
        // Bucket commits based on message
        this.upsertNumMap(el[3].trim().split(/,|\(|:| /, 1)[0].toLowerCase(), commitMessageKeysMap);
        this.updateWeekData(this.findWeekOfYearOfDate(el[2]));
      });
      // Update column chart series data
      this.chart.addSeries({ name: key, data: this.tempData });

      // Update Titles with overview
      // Count commits
      let count = 0;
      this.tempData.forEach((weeklyCommitCount: number) => count += weeklyCommitCount);
      // TODO - Make titles into card components
      this.yearlyDataOverviewObjects.push(
        {
          message: `${key} had ${count} commits. From commits in ${commitMessageKeysMap}`,
          commitKeysMap: commitMessageKeysMap
        });

      // Clear data
      this.tempData = this.getEmptyArrForYearByWeek();
    });
  }

  updateWeekData(weekNumber: number): void {
    // Week number - 1
    // Because the array index starts at 0 but the week number starts at 1
    this.tempData[weekNumber - 1] = this.tempData[weekNumber - 1] ? this.tempData[weekNumber - 1] + 1 : 1;
  }

  // TODO - Make these helper methods
  upsertArrMap(arr: any []): any [][] {
    const key: number = new Date(arr[2]).getFullYear();
    const res: any [] = this.dataMap.get(key) || [];
    res.push(arr);
    this.dataMap.set(key, res);
    return res;
  }

  upsertNumMap(key: string, numMap: Map<string, number>) {
    numMap.set(key, (numMap.get(key) || 0) + 1);
  }

  getInstance(chart): void {
    // chart instance
    this.chart = chart;
  }

  private getEmptyArrForYearByWeek(): number [] {
    return new Array(52).fill(0);
  }

  private getFile(): Observable<any> {
    return this.http.get('./../../assets/commits.local.csv', { responseType: 'text' });
  }

  private findWeekOfYearOfDate(currentDate: string) {
    // Get last day (Dec. 31) or the year of the passed in date
    const lastDateInYearAsNumber = new Date(new Date(currentDate).getFullYear(), 11, 31).getTime();
    const currentDateAsNumber = Date.parse(currentDate);
    // /1000 => convert from milliseconds to seconds
    // /60 => convert from seconds to minutes
    // /60 => convert from minutes to hours
    // /24 => convert from hours to days
    // /7 => convert from days to weeks
    return Math.floor(52 - (lastDateInYearAsNumber - currentDateAsNumber) / 1000 / 60 / 60 / 24 / 7);
  }
}
