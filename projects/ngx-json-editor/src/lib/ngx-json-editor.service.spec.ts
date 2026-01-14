import { TestBed } from '@angular/core/testing';

import { NgxJsonEditorService } from './ngx-json-editor.service';

describe('NgxJsonEditorService', () => {
  let service: NgxJsonEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxJsonEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
