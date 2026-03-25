import { Component, input, output, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonEditorLabels, DEFAULT_LABELS } from '../models/json-editor-config';

@Component({
	selector: 'ngx-json-search',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './json-search.component.html',
	styleUrls: ['./json-search.component.scss'],
})
export class JsonSearchComponent {
	searchTerm = input<string>('');
	totalMatches = input<number>(0);
	currentMatchIndex = input<number>(0);
	show = input<boolean>(false);
	labels = input<Required<JsonEditorLabels>>(DEFAULT_LABELS);

	searchTermChange = output<string>();
	next = output<void>();
	prev = output<void>();
	close = output<void>();

	searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

	onInput(e: any) {
		this.searchTermChange.emit(e.target.value);
	}

	onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (e.shiftKey) {
				this.prev.emit();
			} else {
				this.next.emit();
			}
			e.preventDefault();
		} else if (e.key === 'Escape') {
			this.close.emit();
		}
	}

	focus() {
		this.searchInput()?.nativeElement?.focus();
	}
}
