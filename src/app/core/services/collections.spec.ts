import { TestBed } from '@angular/core/testing';

import { Collections } from './collections';

describe('Collections', () => {
  let service: Collections;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Collections);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
