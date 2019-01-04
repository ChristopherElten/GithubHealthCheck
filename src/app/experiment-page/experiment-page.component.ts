import { Component, OnInit } from '@angular/core';
import { parse } from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import { map } from 'rxjs/operators';
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
  tempData = this.getEmptyArrForYearByWeek();
  commitData: any;
  filterFunctions: ((el) => boolean) [] = [];

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
      this.commitData = commitData;
      this.constructDataSeriesFromCommitData(commitData.data);
      this.updateFromInput = true;
    });
  }

  private constructDataSeriesFromCommitData(data: string[][]): void {
    const dataMap = new Map<number, any []>();
    // Construct data of form [data, value]
    // Value is count of commits in a given week
    // Key of map is the date
    data.forEach((dataPoint) => this.upsertArrMap(dataPoint, dataMap));
    // Take each year, get the week of the year and map it
    dataMap.forEach((yearData: any [], key: number) => {
      const commitKeysMap = new Map<string, number>();
      const authorKeysMap = new Map<string, number>();
      yearData.forEach(el => {
        // Bucket commits by type (based on message)
        this.upsertNumMap(el[3].trim().split(/,|\(|:| /, 1)[0].toLowerCase(), commitKeysMap);
        // Bucket commits by author
        this.upsertNumMap(el[1], authorKeysMap);
        if (this.checkAppliedFilters(el)) {
          this.updateWeekData(this.findWeekOfYearOfDate(el[2]));
        }
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
          year: key,
          message: `${key} had ${count} commits. From commits in ${commitKeysMap}`,
          commitKeysMap: commitKeysMap,
          authorKeysMap: authorKeysMap
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

  sortGraphByCommitType(year: number, commitKey: string): void {
    console.log(year, commitKey);
    this.filterFunctions.push(el => (el[2] as string).indexOf(commitKey) > 0);
  }

  sortGraphByAuthor(year: number, author: string): void {
    // this.filterFunctions.push(el => {
    //     if (el[1] === author) {
    //       console.log(el[1], ' : ', author);
    //     }
    //     // console.log(author);
    //     return el[1] === author;
    //   });
    this.clearDataSeries();
    this.yearlyDataOverviewObjects = [];
    this.commitData.data = this.commitData.data.filter(el => el[1] === author);
    this.constructDataSeriesFromCommitData(this.commitData.data);
    this.updateFromInput = true;
  }

  private clearDataSeries() {
    while (this.chart.series.length) {
      this.chart.series[0].remove(false);
    }
  }

  private checkAppliedFilters(commit): boolean {
    return this.filterFunctions.length < 1 || this.filterFunctions.some(func => func(commit));
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
