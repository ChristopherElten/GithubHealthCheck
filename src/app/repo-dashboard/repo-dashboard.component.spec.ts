import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoDashboardComponent } from './repo-dashboard.component';

describe('RepoDashboardComponent', () => {
  let component: RepoDashboardComponent;
  let fixture: ComponentFixture<RepoDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepoDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
