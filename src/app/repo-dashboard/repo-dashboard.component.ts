import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { mergeMap, flatMap, map, tap } from 'rxjs/operators';
import { of, from } from 'rxjs';

import { GithubService } from '../github.service';
import { token } from '../../../secret';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FileVolatilityDataPoint, FileVolatilityComponent } from '../file-volatility/file-volatility.component';

@Component({
  selector: 'app-repo-dashboard',
  templateUrl: './repo-dashboard.component.html',
  styleUrls: ['./repo-dashboard.component.css']
})
export class RepoDashboardComponent implements OnInit {
  // todo - push frequency/commit frequency/code frequency
  @ViewChild(FileVolatilityComponent) fileVolatilityComponent: FileVolatilityComponent;

  owner: string;
  repo: string;

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
      map(fileVolatilityDataPoint => this.fileVolatilityComponent.addPointToChart(fileVolatilityDataPoint))
    )
    .subscribe();
  }
}

// TODO - Move constants to config/env file
const apiBaseUrl = 'https://api.github.com';

function getCommitsOnRepoApiUrl(owner: string, repo: string): string {
  // GET /repos/:owner/:repo/commits
  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  return `${apiBaseUrl}/repos/${owner}/${repo}/commits?per_page=50`;
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
