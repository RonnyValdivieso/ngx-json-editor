import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { JsonSearchComponent } from './json-search/json-search.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { JsonEditorControlsComponent } from './json-editor-controls/json-editor-controls.component';
import { JsonEditorConfig, JsonEditorLabels, DEFAULT_LABELS } from './models/json-editor-config';

@Component({
	selector: 'ngx-json-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, JsonSearchComponent, JsonEditorControlsComponent],
	templateUrl: './ngx-json-editor.component.html',
	styleUrls: ['./ngx-json-editor.component.scss']
})
export class NgxJsonEditorComponent implements AfterViewInit, OnDestroy {
	@ViewChild('jsonArea') jsonArea!: ElementRef<HTMLTextAreaElement>;
	@ViewChild('highlightOverlay') highlightOverlay?: ElementRef<HTMLDivElement>;
	@ViewChild('gutterEl') gutterEl?: ElementRef<HTMLDivElement>;
	@ViewChild(JsonSearchComponent) jsonSearchComponent?: JsonSearchComponent;

	@Input() initialValue: string = '';
	@Input() config?: JsonEditorConfig;
	@Output() errorChange = new EventEmitter<string | null>();

	jsonText: string = '';
	isValid: boolean = true;
	error: string | null = null;
	searchTerm: string = '';
	showSearch: boolean = false;
	totalMatches: number = 0;
	currentMatchIndex: number = 0;
	private matchPositions: Array<{ start: number; end: number }> = [];

	constructor(
		private sanitizer: DomSanitizer,
		private cdr: ChangeDetectorRef
	) { }

	get labels(): Required<JsonEditorLabels> {
		return { ...DEFAULT_LABELS, ...this.config?.labels };
	}

	get lineNumbers(): number[] {
		const count = this.jsonText ? this.jsonText.split('\n').length : 1;
		return Array.from({ length: count }, (_, i) => i + 1);
	}

	ngOnInit() {
		this.jsonText = this.initialValue;
		this.validateJson(this.jsonText);
	}

	ngAfterViewInit(): void {
		window.addEventListener('keydown', this.onGlobalKeydown);
	}

	ngOnDestroy(): void {
		window.removeEventListener('keydown', this.onGlobalKeydown);
	}

	private onGlobalKeydown = (e: KeyboardEvent) => {
		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const isMod = isMac ? e.metaKey : e.ctrlKey;
		if (isMod && e.key.toLowerCase() === 'f') {
			e.preventDefault();
			this.toggleSearch();
		}
	};

	validateJson(text: string): boolean {
		if (!text.trim()) {
			this.isValid = true;
			this.error = null;
			this.errorChange.emit(null);
			return true;
		}
		try {
			JSON.parse(text);
			this.isValid = true;
			this.error = null;
			this.errorChange.emit(null);
			return true;
		} catch (err: any) {
			this.isValid = false;
			this.error = err.message || 'Invalid JSON';
			this.errorChange.emit(this.error);
			return false;
		}
	}

	onJsonTextChange(value: string) {
		this.jsonText = value;
		this.validateJson(value);
	}

	formatJson() {
		if (!this.jsonText.trim()) return;
		try {
			const parsed = JSON.parse(this.jsonText);
			const formatted = JSON.stringify(parsed, null, 2);
			this.jsonText = formatted;
			this.isValid = true;
			this.error = null;
			this.errorChange.emit(null);
		} catch {
			this.error = 'JSON contains syntax errors';
			this.isValid = false;
			this.errorChange.emit(this.error);
		}
	}

	minifyJson() {
		if (!this.jsonText.trim()) return;
		try {
			const parsed = JSON.parse(this.jsonText);
			const minified = JSON.stringify(parsed);
			this.jsonText = minified;
			this.isValid = true;
			this.error = null;
			this.errorChange.emit(null);
		} catch {
			this.error = 'JSON contains syntax errors';
			this.isValid = false;
			this.errorChange.emit(this.error);
		}
	}

	copyToClipboard() {
		navigator.clipboard.writeText(this.jsonText);
	}

	downloadJson() {
		const blob = new Blob([this.jsonText], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'data.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	handleFileUpload(event: any) {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: any) => {
			const content = e.target?.result as string;
			this.jsonText = content;
			this.validateJson(content);
		};
		reader.readAsText(file);
		event.target.value = '';
	}

	resetEditor() {
		this.jsonText = this.initialValue;
		this.isValid = true;
		this.error = null;
	}

	handleKeyDown(event: KeyboardEvent) {
		const textarea = this.jsonArea?.nativeElement;
		if (!textarea) return;

		if (event.key === 'Tab') {
			event.preventDefault();
			const start = textarea.selectionStart;
			const text = textarea.value;

			if (event.shiftKey) {
				// Shift + Tab (Un-indent)
				const textBefore = text.substring(0, start);
				const lastNewline = textBefore.lastIndexOf('\n');
				const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
				const currentLine = text.substring(lineStart, text.indexOf('\n', lineStart) === -1 ? text.length : text.indexOf('\n', lineStart));

				if (currentLine.startsWith('  ')) {
					// Select the 2 spaces and replace with empty string
					this.replaceSelection(textarea, '', 0, [lineStart, lineStart + 2]);
					// Restore cursor position, shifted back by 2
					const newPos = Math.max(lineStart, start - 2);
					textarea.setSelectionRange(newPos, newPos);
					this.updateUiAfterManualChange();
				}
			} else {
				// Tab (Indent)
				this.replaceSelection(textarea, '  ');
				this.updateUiAfterManualChange();
			}
		} else if (event.key === 'Enter' || event.key === 'NumpadEnter') {
			event.preventDefault();
			const start = textarea.selectionStart;
			const text = textarea.value;
			const textBefore = text.substring(0, start);
			const lines = textBefore.split('\n');
			const currentLine = lines[lines.length - 1];
			const indentation = currentLine.match(/^\s*/)?.[0] || '';

			const charBefore = textBefore.trim().slice(-1);
			const textAfter = text.substring(textarea.selectionEnd);
			const charAfter = textAfter.trim().charAt(0);

			let insertText = '\n' + indentation;
			let cursorOffset: number | undefined;

			if (charBefore === '{' || charBefore === '[') {
				insertText += '  ';
				// Expand block if breaking between {} or []
				if ((charBefore === '{' && charAfter === '}') || (charBefore === '[' && charAfter === ']')) {
					const totalInsert = insertText + '\n' + indentation;
					cursorOffset = insertText.length;
					insertText = totalInsert;
				}
			}

			this.replaceSelection(textarea, insertText, cursorOffset);
			this.updateUiAfterManualChange();
		}
	}

	private replaceSelection(textarea: HTMLTextAreaElement, replacement: string, cursorOffset?: number, selectRange?: [number, number]) {
		if (selectRange) {
			textarea.setSelectionRange(selectRange[0], selectRange[1]);
		}

		// Try to use execCommand to preserve undo stack
		const success = document.execCommand('insertText', false, replacement);

		if (!success) {
			// Fallback for environments where execCommand is not supported (e.g. some tests)
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const val = textarea.value;
			textarea.value = val.substring(0, start) + replacement + val.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + (cursorOffset ?? replacement.length);
		} else if (cursorOffset !== undefined) {
			// If we used execCommand but need to adjust cursor (like block expansion)
			const currentStart = textarea.selectionStart;
			const newPos = currentStart - (replacement.length - cursorOffset);
			textarea.setSelectionRange(newPos, newPos);
		}
	}

	private updateUiAfterManualChange() {
		const textarea = this.jsonArea?.nativeElement;
		if (!textarea) return;

		const newValue = textarea.value;
		this.jsonText = newValue;
		this.validateJson(newValue);

		// Force change detection and scroll sync
		this.cdr.detectChanges();
		this.syncScroll();
	}

	sortKeysAlphabetically() {
		if (!this.jsonText.trim()) return;
		try {
			const parsed = JSON.parse(this.jsonText);
			const sortObjectKeys = (obj: any): any => {
				if (Array.isArray(obj)) {
					return obj.map(sortObjectKeys);
				} else if (obj !== null && typeof obj === 'object') {
					const sortedKeys = Object.keys(obj).sort();
					const sortedObj: any = {};
					sortedKeys.forEach((key) => {
						sortedObj[key] = sortObjectKeys(obj[key]);
					});
					return sortedObj;
				}
				return obj;
			};
			const sortedJson = sortObjectKeys(parsed);
			const formatted = JSON.stringify(sortedJson, null, 2);
			this.jsonText = formatted;
			this.isValid = true;
			this.error = null;
			this.errorChange.emit(null);
		} catch {
			this.error = 'JSON contains syntax errors';
			this.isValid = false;
			this.errorChange.emit(this.error);
		}
	}

	highlightSearchTerm(text: string, term: string, activeIndex: number = -1): SafeHtml {
		if (!term) return this.sanitizer.bypassSecurityTrustHtml(text);
		const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, 'gi');
		let count = 0;
		const html = text.replace(regex, (match) => {
			const isActive = count === activeIndex;
			count++;
			const style = isActive
				? 'background-color: var(--nje-match-active, #f97316); color: white; border-radius: 2px;'
				: 'background-color: var(--nje-match, #fde047); color: black; border-radius: 2px;';
			return `<span style="${style}">${match}</span>`;
		});
		return this.sanitizer.bypassSecurityTrustHtml(html);
	}

	toggleSearch() {
		this.showSearch = !this.showSearch;
		if (!this.showSearch) {
			this.searchTerm = '';
			this.totalMatches = 0;
			this.currentMatchIndex = 0;
			this.matchPositions = [];
			setTimeout(() => this.jsonArea?.nativeElement?.focus(), 0);
		} else {
			setTimeout(() => this.jsonSearchComponent?.focus(), 0);
			setTimeout(() => this.syncScroll(), 0);
		}
	}

	syncScroll(event?: Event) {
		if (this.highlightOverlay && this.jsonArea) {
			this.highlightOverlay.nativeElement.scrollTop = this.jsonArea.nativeElement.scrollTop;
			this.highlightOverlay.nativeElement.scrollLeft = this.jsonArea.nativeElement.scrollLeft;
		}
		if (this.gutterEl && this.jsonArea) {
			this.gutterEl.nativeElement.scrollTop = this.jsonArea.nativeElement.scrollTop;
		}
	}

	closeSearch() {
		this.showSearch = false;
		this.searchTerm = '';
	}

	getSearchMatches(): string {
		if (!this.searchTerm) return '';
		const matches = this.jsonText.match(new RegExp(this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'gi'));
		return matches
			? `${matches.length} match${matches.length !== 1 ? 'es' : ''}`
			: this.labels.noResults;
	}

	onSearchTermChange(term: string) {
		this.searchTerm = term;
		this.findMatches();
	}

	private findMatches() {
		this.matchPositions = [];
		if (!this.searchTerm) {
			this.totalMatches = 0;
			this.currentMatchIndex = 0;
			return;
		}
		const regex = new RegExp(this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'gi');
		let m: RegExpExecArray | null;
		while ((m = regex.exec(this.jsonText)) !== null) {
			this.matchPositions.push({ start: m.index, end: m.index + m[0].length });
			if (m.index === regex.lastIndex) regex.lastIndex++;
		}
		this.totalMatches = this.matchPositions.length;
		this.currentMatchIndex = this.totalMatches > 0 ? 0 : 0;
		if (this.totalMatches > 0) this.selectMatch(0);
	}

	goToNextMatch() {
		if (this.totalMatches === 0) return;
		this.currentMatchIndex = (this.currentMatchIndex + 1) % this.totalMatches;
		this.selectMatch(this.currentMatchIndex);
	}

	goToPreviousMatch() {
		if (this.totalMatches === 0) return;
		this.currentMatchIndex = (this.currentMatchIndex - 1 + this.totalMatches) % this.totalMatches;
		this.selectMatch(this.currentMatchIndex);
	}

	private selectMatch(index: number) {
		const pos = this.matchPositions[index];
		if (!pos) return;
		const textarea = this.jsonArea?.nativeElement;
		if (!textarea) return;
		textarea.selectionStart = pos.start;
		textarea.selectionEnd = pos.end;
		const before = this.jsonText.substring(0, pos.start);
		const line = before.split('\n').length;
		const lineHeight = 20;
		textarea.scrollTop = Math.max(0, (line - 5) * lineHeight);
	}
}
