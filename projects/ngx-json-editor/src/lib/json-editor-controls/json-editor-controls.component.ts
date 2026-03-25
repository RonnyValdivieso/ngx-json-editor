import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { JsonEditorConfig, JsonEditorLabels, DEFAULT_LABELS } from '../models/json-editor-config';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'ngx-json-editor-controls',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './json-editor-controls.component.html',
	styleUrls: ['./json-editor-controls.component.scss']
})
export class JsonEditorControlsComponent {
	@Input() config?: JsonEditorConfig;
	@Input() labels: Required<JsonEditorLabels> = DEFAULT_LABELS;

	@Output() format = new EventEmitter<void>();
	@Output() minify = new EventEmitter<void>();
	@Output() sort = new EventEmitter<void>();
	@Output() toggleSearch = new EventEmitter<void>();
	@Output() copy = new EventEmitter<void>();
	@Output() download = new EventEmitter<void>();
	@Output() reset = new EventEmitter<void>();
	@Output() load = new EventEmitter<Event>();
}
