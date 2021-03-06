import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import { map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
HC_more(Highcharts);

// TODO
// View by week, month, day
// View by lines of code* Requires more data
// Filter by commit key(s) (e.g. fix)
// Filter by author(s)
//
// Get high level res such as
// - Commits per year
// - Avg commits per week
// - Lines of code per year
export interface CommitData {
  data: string [][]; // [[ hash: string ], [author: string], [date: string], [message: string]]
  errors: any []; // [{ type: string, code: string, index: number, row: number, message: string }]
}

export interface YearlyDataOverviewObject {
  year: number;
  message: string;
  commitKeysMap: Map<string, number>;
  authorKeysMap: Map<string, number>;
}

export enum XAxisOptions {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
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
  // dataMap = new Map<number, any []>();
  // OTHER
  // Mass GIT meta data editor
  commitData: any;
  visibleCommitData: any;
  viewBySelectedOption: XAxisOptions = XAxisOptions.DAY;

  // Filter data
  private authorFilters: string [] = [];
  private commitTypeFilters: string [] = [];

  authorKeysMap = new Map<string, number>();
  commitKeysMap = new Map<string, number>();

  // Search Facet
  authors = new FormControl();
  commits = new FormControl();

  // Highchart things
  updateFromInput = false;
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
      this.commitData = commitData.data;
      this.visibleCommitData = commitData.data;
      this.constructDataSeriesFromCommitData(this.visibleCommitData);
      this.updateFromInput = true;
    });
  }

  updateViewBy(): void {
    this.clearDataSeries();
    this.yearlyDataOverviewObjects = [];
    this.constructDataSeriesFromCommitData(this.visibleCommitData);
    this.updateFromInput = true;
  }

  private constructDataSeriesFromCommitData(data: string[][]): void {
    let tempData = this.getEmptyArray();
    const dataMap = new Map<number, any []>();
    // Construct data of form [data, value]
    // Value is count of commits in a given week
    // Key of map is the date
    data.forEach((dataPoint) => this.upsertArrMap(dataPoint, dataMap));
    // Take each year, get the week of the year and map it
    dataMap.forEach((yearData: any [], key: number) => {
      const yearlyCommitKeysMap = new Map<string, number>();
      const yearlyAuthorKeysMap = new Map<string, number>();
      yearData.forEach(el => {
        // TODO - how to not increment commitKeysMap if already complete
        // Bucket commits by type (based on message)
        this.upsertNumMap(this.getCommitTypeFromCommitMessage(el[3]), yearlyCommitKeysMap);
        this.upsertNumMap(this.getCommitTypeFromCommitMessage(el[3]), this.commitKeysMap);
        // Bucket commits by author
        this.upsertNumMap(el[1], yearlyAuthorKeysMap);
        this.upsertNumMap(el[1], this.authorKeysMap);
        // Week number - 1
        // Because the array index starts at 0 but the week number starts at 1
        this.incrementArrayEntry(this.findIndexFromData(el[2]), tempData);
      });
      // Update column chart series data
      this.chart.addSeries({ name: key, data: tempData });

      // Update Titles with overview
      // Count commits
      let count = 0;
      tempData.forEach((weeklyCommitCount: number) => count += weeklyCommitCount);

      // Clear data
      tempData = this.getEmptyArray();
    });
  }

  incrementArrayEntry(index: number, array: any []): void {
    array[index] = array[index] ? array[index] + 1 : 1;
  }

  // TODO - Make these helper methods
  upsertArrMap(arr: any [], arrMap: Map<number, string []>): any [][] {
    const key: number = new Date(arr[2]).getFullYear();
    const res: any [] = arrMap.get(key) || [];
    res.push(arr);
    arrMap.set(key, res);
    return res;
  }

  upsertNumMap(key: string, numMap: Map<string, number>) {
    numMap.set(key, (numMap.get(key) || 0) + 1);
  }

  getInstance(chart): void {
    // chart instance
    this.chart = chart;
  }

  // Sorting and filtering
  filterGraphByCommitTypes(commitTypes: string []): void {
    this.clearDataSeries();
    this.visibleCommitData = this.commitData.filter(el => commitTypes.includes(this.getCommitTypeFromCommitMessage(el[3])));
    this.constructDataSeriesFromCommitData(this.visibleCommitData);
    this.updateFromInput = true;
  }

  filterGraphByAuthors(authors: string[]): void {
    this.clearDataSeries();
    this.visibleCommitData = this.commitData.filter(el => authors.includes(el[1]));
    this.constructDataSeriesFromCommitData(this.visibleCommitData);
    this.updateFromInput = true;
  }

  private getCommitTypeFromCommitMessage(commitMessage: string): string {
    return commitMessage.trim().split(/,|\(|:| /, 1)[0].toLowerCase();
  }

  private clearDataSeries() {
    while (this.chart.series.length) {
      this.chart.series[0].remove(false);
    }
  }

  private getEmptyArray(): number [] {
    switch (this.viewBySelectedOption) {
      case XAxisOptions.MONTH:
        return new Array(12).fill(0);
      case XAxisOptions.WEEK:
        return new Array(52).fill(0);
      case XAxisOptions.DAY:
        return new Array(365).fill(0);
    }
  }

  private getFile(): Observable<any> {
    return this.http.get('./../../assets/commits.local.csv', { responseType: 'text' });
  }

  private findDayOfYear(currentDate: string): number {
    const currentDateAsNumber = Date.parse(currentDate);
    const date = new Date(currentDate);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (currentDateAsNumber - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    // return Math.floor(52 - (lastDateInYearAsNumber - currentDateAsNumber) / 1000 / 60 / 60 / 24 / 7);
    return day;
  }

  private findWeekOfYear(currentDate: string): number {
    const lastDateInYearAsNumber = new Date(new Date(currentDate).getFullYear(), 11, 31).getTime();
    const currentDateAsNumber = Date.parse(currentDate);
    // /1000 => convert from milliseconds to seconds
    // /60 => convert from seconds to minutes
    // /60 => convert from minutes to hours
    // /24 => convert from hours to days
    // /7 => convert from days to weeks
    return Math.floor(52 - (lastDateInYearAsNumber - currentDateAsNumber) / 1000 / 60 / 60 / 24 / 7);
  }

  private findMonthOfYear(currentDate: string): number {
    return new Date(currentDate).getMonth();
  }

  private findIndexFromData(currentDate: string): number {
    switch (this.viewBySelectedOption) {
      case XAxisOptions.MONTH:
        return this.findMonthOfYear(currentDate);
      case XAxisOptions.WEEK:
        return this.findWeekOfYear(currentDate);
      case XAxisOptions.DAY:
        return this.findDayOfYear(currentDate);
    }
  }
}
