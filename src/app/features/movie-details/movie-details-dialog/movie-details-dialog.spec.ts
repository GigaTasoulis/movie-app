import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieDetailsDialogComponent } from './movie-details-dialog';

describe('MovieDetailsDialogComponent', () => {
  let component: MovieDetailsDialogComponent;
  let fixture: ComponentFixture<MovieDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetailsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieDetailsDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
