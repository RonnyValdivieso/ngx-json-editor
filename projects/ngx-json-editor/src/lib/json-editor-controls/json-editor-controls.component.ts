import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { JsonEditorConfig } from '../models/json-editor-config';

@Component({
	selector: 'ngx-json-editor-controls',
	standalone: true,
	imports: [],
	templateUrl: './json-editor-controls.component.html',
	styleUrls: ['./json-editor-controls.component.scss']
})
export class JsonEditorControlsComponent implements OnInit {
	@Input() config?: JsonEditorConfig;

	@Output() format = new EventEmitter<void>();
	@Output() minify = new EventEmitter<void>();
	@Output() sort = new EventEmitter<void>();
	@Output() toggleSearch = new EventEmitter<void>();
	@Output() copy = new EventEmitter<void>();
	@Output() download = new EventEmitter<void>();
	@Output() reset = new EventEmitter<void>();
	@Output() load = new EventEmitter<Event>();

	ngOnInit() {
		console.log('config', this.config);
	}
}
