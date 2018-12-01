import { Component, OnInit } from '@angular/core';
import { GithubService } from './github.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // TODO - Move constants to config/env file
  apiBaseUrl: string;
  listCommitsOnRepoApiUrl: string;
  getCommitApiUrl: string;

  title = 'app';

  constructor(private githubService: GithubService, private http: HttpClient) { }

  ngOnInit() {
    // Make request for latest 30 Commits on repo
    // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
    
    // This is a placeholder get request to demo http get
    this.http.get('https://jsonplaceholder.typicode.com/todos/1').subscribe(t => console.log(t));

    // Make request for each commit
    // https://developer.github.com/v3/repos/commits/#get-a-single-commit


  }
}
