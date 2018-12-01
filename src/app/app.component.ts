import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { mergeMap, flatMap, map, tap } from 'rxjs/operators';
import { of, from } from 'rxjs';

import { GithubService } from './github.service';
import { token } from './../../secret';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
      )
    )
    .subscribe((res: any) => {
      // Do something with files here
      console.log(res);
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
