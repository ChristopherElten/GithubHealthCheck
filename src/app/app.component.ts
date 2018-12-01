import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { mergeMap, flatMap, map, tap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
HC_more(Highcharts);

import { GithubService } from './github.service';
import { token } from './../../secret';

interface FileVolatilityDataPoint {
  file: string;
  totalLinesChanged: number;
  changeFrequency: number;
  lastModifiedDate: number;
  contributors: string[];
  contributorCount: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  data = [];

  // Highchart things
  Highcharts = Highcharts;
  chartOptions = {
    chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy'
    },

    legend: {
        enabled: false
    },

    title: {
        text: 'File Volatility as a measure of file size and change frequency'
    },

    subtitle: {
        text: '<a href="https://github.com/ChristopherElten/">A HackDay project by Christopher Elten</a>'
    },

    xAxis: {
        gridLineWidth: 1,
        title: {
            text: 'Lines of Code (LOC) Changed'
        },
        labels: {
            format: '{value} LOC'
        }
    },

    yAxis: {
        startOnTick: false,
        endOnTick: false,
        title: {
            text: 'Change Frequency'
        },
        labels: {
            format: '{value}'
        },
        maxPadding: 0.2
    },
    // TODO - Change tooltip to refer to data
    tooltip: {
        useHTML: true,
        headerFormat: '<table>',
        pointFormat: '<tr><th colspan="2"><h3>{point.file}</h3></th></tr>' +
            '<tr><th>Fat intake:</th><td>{point.x}g</td></tr>' +
            '<tr><th>Sugar intake:</th><td>{point.y}g</td></tr>' +
            '<tr><th>Obesity (adults):</th><td>{point.z}%</td></tr>',
        footerFormat: '</table>',
        followPointer: true
    },

    plotOptions: {
        series: {
            dataLabels: {
                enabled: true,
                format: '{point.file}'
            }
        }
    },

    series: [{
        data: this.data
    }]
  };

  updateFromInput = false;

  title = 'app';
  owner = 'angular';
  repo = 'angular';

  constructor(private githubService: GithubService, private http: HttpClient) { }

  ngOnInit() {
    this.http.get(
      getCommitsOnRepoApiUrl(this.owner, this.repo),
      getHttpOptions(token)
    )
    .pipe(
      // Flatten arraylist of commits
      flatMap((commits: any) =>
       of(...commits)
      ),
      // Make request for each commit information
      mergeMap((commit) =>
        this.http.get(
          getCommitApiUrl(this.owner, this.repo, commit.sha),
          getHttpOptions(token)
        )
      ),
      tap(commit => console.log(commit)),
      map(commit => generateFileVolatilityDataPointsFromCommit(commit)),
      flatMap(fileVolatilityDataPoints => of(...fileVolatilityDataPoints)),
      map(fileVolatilityDataPoint => generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint))
    )
    .subscribe((dataPoint: any) => {
      this.chartOptions.series[0].data.push(dataPoint);
      // this.data.push(dataPoint);
      // nested change - must trigger update
      this.updateFromInput = true;
    });
  }
}

  // TODO - Move constants to config/env file
const apiBaseUrl = 'https://api.github.com';

function getCommitsOnRepoApiUrl(owner: string, repo: string): string {
  // GET /repos/:owner/:repo/commits
  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  return `${apiBaseUrl}/repos/${owner}/${repo}/commits?per_page=2`;
}

function getCommitApiUrl(owner: string, repo: string, sha: string): string {
  // GET /repos/:owner/:repo/commits/:sha
  // https://developer.github.com/v3/repos/commits/#get-a-single-commit
  return `${apiBaseUrl}/repos/${owner}/${repo}/commits/${sha}`;
}

function getHttpOptions(TOKEN: string): {
  headers?: HttpHeaders | {
      [header: string]: string | string[];
  };
  observe?: 'body';
  params?: HttpParams | {
      [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
} {
  return {
    headers: {
      Authorization: `token ${TOKEN}`
    }
  };
}

function generateFileVolatilityDataPointsFromCommit(commit): FileVolatilityDataPoint[] {
  const lastModifiedDate = commit.commit.author.date;
  const arr = [];
  commit.files.forEach(file => {
    arr.push({
      totalLinesChanged: file.changes,
      file: file.filename,
      lastModifiedDate: Date.parse(lastModifiedDate)
    });
  });

  return arr;
}

function generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint: FileVolatilityDataPoint) {
  return {
    x: fileVolatilityDataPoint.lastModifiedDate,
    y: 10/* fileVolatilityDataPoint.changeFrequency */,
    z: fileVolatilityDataPoint.totalLinesChanged,
    name: 'tempNameToParseFromFile',
    file: fileVolatilityDataPoint.file
  };
}
