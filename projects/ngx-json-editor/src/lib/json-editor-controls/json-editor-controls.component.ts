import { Component, input, output } from '@angular/core';
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
	config = input<JsonEditorConfig>();
	labels = input<Required<JsonEditorLabels>>(DEFAULT_LABELS);

	format = output<void>();
	minify = output<void>();
	sort = output<void>();
	toggleSearch = output<void>();
	copy = output<void>();
	download = output<void>();
	reset = output<void>();
	load = output<Event>();
	foldAll = output<void>();
	unfoldAll = output<void>();

	hasFolds = input<boolean>(false);
}
