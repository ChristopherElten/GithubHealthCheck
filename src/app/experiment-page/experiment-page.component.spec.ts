import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentPageComponent } from './experiment-page.component';

describe('ExperimentPageComponent', () => {
  let component: ExperimentPageComponent;
  let fixture: ComponentFixture<ExperimentPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
