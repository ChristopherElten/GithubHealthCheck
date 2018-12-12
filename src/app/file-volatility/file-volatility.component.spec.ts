import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileVolatilityComponent } from './file-volatility.component';

describe('FileVolatilityComponent', () => {
  let component: FileVolatilityComponent;
  let fixture: ComponentFixture<FileVolatilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileVolatilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileVolatilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
