import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, flatMap, map, tap } from 'rxjs/operators';
import { of, from } from 'rxjs';

import { GithubService } from '../github.service';
import { token } from '../../../secret';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
HC_more(Highcharts);

interface FileVolatilityDataPoint {
  file: string;
  totalLinesChanged: number;
  changeFrequency: number;
  lastModifiedDate: number;
  contributors: string[];
  contributorCount: number;
}

@Component({
  selector: 'app-repo-dashboard',
  templateUrl: './repo-dashboard.component.html',
  styleUrls: ['./repo-dashboard.component.css']
})
export class RepoDashboardComponent implements OnInit {
  owner: string;
  repo: string;

  data = [];
  dataMap = new Map<string, FileVolatilityDataPoint>();

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
      type: 'datetime'
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
            '<tr><th>Last Modified Date:</th><td>{point.x}</td></tr>' +
            '<tr><th>Change Frequency:</th><td>{point.y}</td></tr>' +
            '<tr><th>Total Lines of Code Changed:</th><td>{point.z}</td></tr>',
        footerFormat: '</table>',
        followPointer: true
    },

    plotOptions: {
        series: {
            dataLabels: {
                enabled: true,
                format: '{point.name}'
            }
        }
    },
    series: [{
        data: this.data
    }]
  };

  updateFromInput = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('owner');
    this.repo = this.route.snapshot.paramMap.get('repo');

    this.http.get(
      getCommitsOnRepoApiUrl(this.owner, this.repo),
      getHttpOptions(token)
    )
    .pipe(
      // Flatten arraylist of commits
      flatMap((commits: any) => of(...commits)),
      // Make request for each commit information
      mergeMap((commit) =>
        this.http.get(
          getCommitApiUrl(this.owner, this.repo, commit.sha),
          getHttpOptions(token)
        )
      ),
      map(commit => generateFileVolatilityDataPointsFromCommit(commit)),
      flatMap(fileVolatilityDataPoints => of(...fileVolatilityDataPoints)),
      map(fileVolatilityDataPoint => this.upsertMap(fileVolatilityDataPoint))
    );
    // Uncomment this to make too many requests
    // .subscribe((() => this.generateDataFromMap()));
  }

  private generateDataFromMap() {
    this.dataMap.forEach(fileVolatilityDataPoint =>
      this.data.push(generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint)));

    this.updateFromInput = true;
  }


  private upsertMap(fileVolatilityDataPoint: FileVolatilityDataPoint): FileVolatilityDataPoint {
    const data = this.dataMap.get(fileVolatilityDataPoint.file);

    if (!data) {
      this.dataMap.set(fileVolatilityDataPoint.file, fileVolatilityDataPoint);
      return fileVolatilityDataPoint;
    } else {
      this.dataMap.set(fileVolatilityDataPoint.file, {
        file: fileVolatilityDataPoint.file,
        changeFrequency: data.changeFrequency + 1,
        lastModifiedDate: fileVolatilityDataPoint.lastModifiedDate,
        totalLinesChanged: fileVolatilityDataPoint.totalLinesChanged + data.totalLinesChanged,
        contributorCount: 1,
        contributors: []
      });
      return fileVolatilityDataPoint;
    }
  }

}

// TODO - Move constants to config/env file
const apiBaseUrl = 'https://api.github.com';

function getCommitsOnRepoApiUrl(owner: string, repo: string): string {
  // GET /repos/:owner/:repo/commits
  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  return `${apiBaseUrl}/repos/${owner}/${repo}/commits?per_page=100`;
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
      lastModifiedDate: Date.parse(lastModifiedDate),
      changeFrequency: 1
    });
  });

  return arr;
}

function generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint: FileVolatilityDataPoint) {
  return {
    x: fileVolatilityDataPoint.lastModifiedDate,
    y: fileVolatilityDataPoint.changeFrequency,
    z: fileVolatilityDataPoint.totalLinesChanged,
    name: fileVolatilityDataPoint.file.split('/').reverse()[0],
    file: fileVolatilityDataPoint.file
  };
}
