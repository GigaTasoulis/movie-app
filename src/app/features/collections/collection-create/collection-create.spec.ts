import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionCreate } from './collection-create';

describe('CollectionCreate', () => {
  let component: CollectionCreate;
  let fixture: ComponentFixture<CollectionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
