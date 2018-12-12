import { Component, OnInit, Input, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import { pipe, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
// import { HighchartsChartComponent } from 'highcharts-angular';
HC_more(Highcharts);

export interface FileVolatilityDataPoint {
  file: string;
  totalLinesChanged: number;
  changeFrequency: number;
  lastModifiedDate: number;
  contributors: string[];
  contributorCount: number;
}

@Component({
  selector: 'app-file-volatility',
  templateUrl: './file-volatility.component.html',
  styleUrls: ['./file-volatility.component.css']
})
export class FileVolatilityComponent implements OnInit {
  // @ViewChild(HighchartsChartComponent) highchartsChartComponent: HighchartsChartComponent;
  @Input() repo: string;
  @Input() owner: string;

  data = [];
  dataMap = new Map<string, FileVolatilityDataPoint>();
  updateFromInput = false;

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
      type: 'datetime',
      title: {
        text: 'Last Modified Date'
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
            '<tr><th>Last Modified Date:</th><td>{Date.parse(point.x)}</td></tr>' +
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

  constructor() { }

  ngOnInit() {
  }

  private upsertMap(fileVolatilityDataPoint: FileVolatilityDataPoint): FileVolatilityDataPoint {
    const data = this.dataMap.get(fileVolatilityDataPoint.file);

    if (!data) {
      this.dataMap.set(fileVolatilityDataPoint.file, fileVolatilityDataPoint);
      return fileVolatilityDataPoint;
    } else {
      const newFileVolatilityDataPoint = {
        file: fileVolatilityDataPoint.file,
        changeFrequency: data.changeFrequency + 1,
        lastModifiedDate: fileVolatilityDataPoint.lastModifiedDate,
        totalLinesChanged: fileVolatilityDataPoint.totalLinesChanged + data.totalLinesChanged,
        contributorCount: 1,
        contributors: []
      };
      this.dataMap.set(fileVolatilityDataPoint.file, newFileVolatilityDataPoint);
      return newFileVolatilityDataPoint;
    }
  }

  addPointToChart(fileVolatilityDataPoint: FileVolatilityDataPoint): void {
    of(fileVolatilityDataPoint)
    .pipe(
      map(() => this.upsertMap(fileVolatilityDataPoint)),
      map(updatedFileVolatilityDataPoint => generateHighchartsDataFromFileVolatilityDataPoints(updatedFileVolatilityDataPoint)),
      map(dataPoint => this.updateChartWithDataPoint(dataPoint))
    ).subscribe();
  }

  private updateChartWithDataPoint(dataPoint): void {
    this.generateDataFromMap();
  }

  private generateDataFromMap(): void {
    // Wipe entire array and rewrite map
    // Instead of finding and replacing in array
    // Performance decision
    this.data.length = 0;
    this.dataMap.forEach(fileVolatilityDataPoint =>
      this.data.push(generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint)));

    this.updateFromInput = true;
  }

}

function generateHighchartsDataFromFileVolatilityDataPoints(fileVolatilityDataPoint: FileVolatilityDataPoint): {} {
  return {
    x: fileVolatilityDataPoint.lastModifiedDate,
    y: fileVolatilityDataPoint.changeFrequency,
    z: fileVolatilityDataPoint.totalLinesChanged,
    name: fileVolatilityDataPoint.file.split('/').reverse()[0],
    file: fileVolatilityDataPoint.file
  };
}
