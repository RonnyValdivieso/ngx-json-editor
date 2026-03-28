import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Component, viewChild, input, output, model, effect, untracked, AfterViewInit, OnDestroy, ChangeDetectorRef, forwardRef, ElementRef } from '@angular/core';
import { JsonSearchComponent } from './json-search/json-search.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { JsonEditorControlsComponent } from './json-editor-controls/json-editor-controls.component';
import { JsonEditorConfig, JsonEditorLabels, DEFAULT_LABELS } from './models/json-editor-config';
import { JsonFoldingService, FoldState, FoldRegion } from './json-folding.service';

@Component({
	selector: 'ngx-json-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, JsonSearchComponent, JsonEditorControlsComponent],
	templateUrl: './ngx-json-editor.component.html',
	styleUrls: ['./ngx-json-editor.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => NgxJsonEditorComponent),
			multi: true
		}
	]
})
export class NgxJsonEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
	codeEditor = viewChild<ElementRef<HTMLDivElement>>('codeEditor');
	highlightOverlay = viewChild<ElementRef<HTMLDivElement>>('highlightOverlay');
	gutterEl = viewChild<ElementRef<HTMLDivElement>>('gutterEl');
	jsonSearchComponent = viewChild<JsonSearchComponent>(JsonSearchComponent);

	initialValue = input<string>('');
	config = input<JsonEditorConfig>();
	disabled = model<boolean>(false);
	
	data = input<any>();
	dataChange = output<any>();
	
	errorChange = output<string | null>();

	jsonText: string = '';
	isValid: boolean = true;
	error: string | null = null;
	errorLine: number | null = null;
	searchTerm: string = '';
	showSearch: boolean = false;
	totalMatches: number = 0;
	currentMatchIndex: number = 0;
	private matchPositions: Array<{ start: number; end: number }> = [];

	// Code Folding state
	foldStates: FoldState[] = [];
	foldableLines: Set<number> = new Set();

	private onChange: any = () => {};
	private onTouch: any = () => {};
	private isRendering = false;

	constructor(
		private sanitizer: DomSanitizer,
		private cdr: ChangeDetectorRef,
		private foldingService: JsonFoldingService
	) {
		effect(() => {
			const d = this.data();
			untracked(() => {
				if (d !== undefined) {
					this.writeValue(d);
				}
			});
		});
	}

	get labels(): Required<JsonEditorLabels> {
		return { ...DEFAULT_LABELS, ...this.config()?.labels };
	}

	get lineNumbers(): number[] {
		const count = this.jsonText ? this.jsonText.split('\n').length : 1;
		return Array.from({ length: count }, (_, i) => i + 1);
	}

	private extractErrorLine(errorMessage: string, text: string): number | null {
		if (!errorMessage || !text) return null;

		const positionMatch = errorMessage.match(/position (\d+)/i);
		if (positionMatch && positionMatch[1]) {
			const position = parseInt(positionMatch[1], 10);
			const textUpToError = text.substring(0, position);
			return textUpToError.split('\n').length;
		}

		const lineMatch = errorMessage.match(/line (\d+)/i);
		if (lineMatch && lineMatch[1]) {
			return parseInt(lineMatch[1], 10);
		}

		if (errorMessage.toLowerCase().includes("unexpected token ']'") || 
			errorMessage.toLowerCase().includes("unexpected token '}'")) {
			const trailingCommaMatch = text.match(/,\s*[\]}]/);
			if (trailingCommaMatch && trailingCommaMatch.index !== undefined) {
				const textUpToComma = text.substring(0, trailingCommaMatch.index);
				return textUpToComma.split('\n').length;
			}
		}

		return null;
	}

	ngOnInit() {
		this.jsonText = this.initialValue();
		this.validateJson(this.jsonText);
		this.updateFoldableLines();
	}

	ngAfterViewInit(): void {
		window.addEventListener('keydown', this.onGlobalKeydown);
		this.renderEditor();
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

	// ControlValueAccessor Implementation
	writeValue(obj: any): void {
		let valueToSet = obj;
		if (obj && typeof obj === 'object') {
			valueToSet = JSON.stringify(obj, null, 2);
		} else if (obj !== null && obj !== undefined) {
			valueToSet = String(obj);
		} else {
			valueToSet = '';
		}
		
		if (this.jsonText !== valueToSet) {
			this.jsonText = valueToSet;
			this.validateJson(this.jsonText);
			this.updateFoldableLines();
			this.renderEditor();
			this.cdr.markForCheck();
		}
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
		this.cdr.markForCheck();
	}

	onBlur() {
		this.onTouch();
	}

	private emitValue(value: string) {
		if (this.validateJson(value)) {
			try {
				const parsed = value.trim() ? JSON.parse(value) : null;
				this.onChange(parsed);
				this.dataChange.emit(parsed);
			} catch {
				this.onChange(value);
				this.dataChange.emit(value);
			}
		} else {
			this.onChange(value);
			this.dataChange.emit(value);
		}
	}

	validateJson(text: string): boolean {
		if (!text.trim()) {
			this.isValid = true;
			this.error = null;
			this.errorLine = null;
			this.errorChange.emit(null);
			return true;
		}
		try {
			JSON.parse(text);
			this.isValid = true;
			this.error = null;
			this.errorLine = null;
			this.errorChange.emit(null);
			return true;
		} catch (err: any) {
			this.isValid = false;
			this.error = err.message || 'Invalid JSON';
			this.errorLine = this.extractErrorLine(this.error || '', text);
			this.errorChange.emit(this.error);
			return false;
		}
	}

	// ─── Contenteditable rendering ──────────────────────────────

	renderEditor() {
		const editor = this.codeEditor()?.nativeElement;
		if (!editor) return;

		this.isRendering = true;
		const lines = this.jsonText.split('\n');
		const htmlParts = lines.map((line, index) => {
			const lineNumber = index + 1;
			let escaped = this.escapeHtml(line);

			// Replace fold placeholder text with styled badge
			const fold = this.foldStates.find(f => f.startLine === lineNumber);
			if (fold) {
				const escapedPlaceholder = this.escapeHtml(fold.placeholder);
				escaped = escaped.replace(
					escapedPlaceholder,
					`<span class="nje-fold-badge" contenteditable="false">${escapedPlaceholder}</span>`
				);
			}

			return escaped;
		});

		editor.innerHTML = htmlParts.join('\n');
		this.isRendering = false;
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// ─── Input handling ──────────────────────────────────────────

	onEditorInput() {
		if (this.isRendering) return;

		const editor = this.codeEditor()?.nativeElement;
		if (!editor) return;

		let text = editor.innerText;

		// Restore folded content if there are active folds
		if (this.foldStates.length > 0) {
			for (const fold of this.foldStates) {
				const openBracket = fold.placeholder.charAt(0) === '{' ? '{' : '[';
				const replacement = openBracket + '\n' + fold.originalContent;
				text = text.replace(fold.placeholder, replacement);
			}
			this.foldStates = [];
		}

		this.jsonText = text;
		this.updateFoldableLines();
		this.emitValue(text);
	}

	formatJson() {
		this.ensureUnfolded();
		if (!this.jsonText.trim()) return;
		try {
			const parsed = JSON.parse(this.jsonText);
			const formatted = JSON.stringify(parsed, null, 2);
			this.jsonText = formatted;
			this.updateFoldableLines();
			this.renderEditor();
			this.emitValue(this.jsonText);
		} catch {
			this.error = 'JSON contains syntax errors';
			this.isValid = false;
			this.errorChange.emit(this.error);
		}
	}

	minifyJson() {
		this.ensureUnfolded();
		if (!this.jsonText.trim()) return;
		try {
			const parsed = JSON.parse(this.jsonText);
			const minified = JSON.stringify(parsed);
			this.jsonText = minified;
			this.updateFoldableLines();
			this.renderEditor();
			this.emitValue(this.jsonText);
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
			this.updateFoldableLines();
			this.renderEditor();
			this.emitValue(content);
		};
		reader.readAsText(file);
		event.target.value = '';
	}

	resetEditor() {
		this.jsonText = this.initialValue();
		this.foldStates = [];
		this.updateFoldableLines();
		this.renderEditor();
		this.emitValue(this.jsonText);
	}

	// ─── Key handling (Selection API for contenteditable) ─────────

	handleKeyDown(event: KeyboardEvent) {
		const editor = this.codeEditor()?.nativeElement;
		if (!editor) return;

		if (event.key === 'Tab') {
			event.preventDefault();
			const sel = window.getSelection();
			if (!sel || !sel.rangeCount) return;

			if (event.shiftKey) {
				// Shift + Tab (Un-indent)
				const { textBefore } = this.getEditorCursorContext(editor, sel);
				const fullText = editor.innerText;
				const lastNewline = textBefore.lastIndexOf('\n');
				const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
				const lineEnd = fullText.indexOf('\n', lineStart);
				const currentLine = fullText.substring(lineStart, lineEnd === -1 ? fullText.length : lineEnd);

				if (currentLine.startsWith('  ')) {
					// Remove 2 leading spaces by replacing full text
					const newText = fullText.substring(0, lineStart) + currentLine.substring(2) + fullText.substring(lineEnd === -1 ? fullText.length : lineEnd);
					this.jsonText = newText;
					if (this.foldStates.length > 0) this.foldStates = [];
					this.updateFoldableLines();
					this.renderEditor();
					this.emitValue(newText);
					// Restore cursor
					const newPos = Math.max(lineStart, textBefore.length - 2);
					this.setCursorByOffset(editor, newPos);
				}
			} else {
				// Tab (Indent)
				document.execCommand('insertText', false, '  ');
				this.onEditorInput();
			}
		} else if (event.key === 'Enter' || event.key === 'NumpadEnter') {
			event.preventDefault();
			const sel = window.getSelection();
			if (!sel || !sel.rangeCount) return;

			const { textBefore, textAfter } = this.getEditorCursorContext(editor, sel);
			const lines = textBefore.split('\n');
			const currentLine = lines[lines.length - 1];
			const indentation = currentLine.match(/^\s*/)?.[0] || '';

			const charBefore = textBefore.replace(/[ \t]+$/, '').slice(-1);
			const charAfter = textAfter.replace(/^[ \t]+/, '').charAt(0);

			let insertText = '\n' + indentation;
			let needsBlockExpansion = false;

			if (charBefore === '{' || charBefore === '[') {
				insertText += '  ';
				if ((charBefore === '{' && charAfter === '}') || (charBefore === '[' && charAfter === ']')) {
					needsBlockExpansion = true;
				}
			}

			if (needsBlockExpansion) {
				const cursorInsert = insertText;
				const fullInsert = cursorInsert + '\n' + indentation;
				document.execCommand('insertText', false, fullInsert);
				// Move cursor back to after the indented line
				const moveBack = '\n'.length + indentation.length;
				this.moveCursorBack(moveBack);
			} else {
				document.execCommand('insertText', false, insertText);
			}
			this.onEditorInput();
		}
	}

	private getEditorCursorContext(editor: HTMLElement, sel: Selection): { textBefore: string; textAfter: string } {
		const range = sel.getRangeAt(0);
		const preRange = document.createRange();
		preRange.selectNodeContents(editor);
		preRange.setEnd(range.startContainer, range.startOffset);
		const textBefore = preRange.toString();
		const fullText = editor.innerText;
		const textAfter = fullText.substring(textBefore.length);
		return { textBefore, textAfter };
	}

	private moveCursorBack(chars: number) {
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;
		const editor = this.codeEditor()?.nativeElement;
		if (!editor) return;

		// Get current offset in full text
		const range = sel.getRangeAt(0);
		const preRange = document.createRange();
		preRange.selectNodeContents(editor);
		preRange.setEnd(range.startContainer, range.startOffset);
		const currentPos = preRange.toString().length;

		this.setCursorByOffset(editor, currentPos - chars);
	}

	private setCursorByOffset(editor: HTMLElement, offset: number) {
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
		let remaining = offset;
		let node: Text | null;

		while ((node = walker.nextNode() as Text)) {
			if (remaining <= node.length) {
				const range = document.createRange();
				range.setStart(node, remaining);
				range.collapse(true);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				return;
			}
			remaining -= node.length;
		}
	}

	sortKeysAlphabetically() {
		this.ensureUnfolded();
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
			this.updateFoldableLines();
			this.renderEditor();
			this.emitValue(this.jsonText);
		} catch {
			this.error = 'JSON contains syntax errors';
			this.isValid = false;
			this.errorChange.emit(this.error);
		}
	}

	highlightSearchTerm(text: string, term: string, activeIndex: number = -1): SafeHtml {
		const escaped = this.escapeHtml(text);
		if (!term) return this.sanitizer.bypassSecurityTrustHtml(escaped);
		const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escapedTerm})`, 'gi');
		let count = 0;
		const html = escaped.replace(regex, (match) => {
			count++;
			const style = 'background-color: var(--nje-match, #fde047); color: black; border-radius: 2px;';
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
			setTimeout(() => this.codeEditor()?.nativeElement?.focus(), 0);
		} else {
			this.cdr.detectChanges();
			setTimeout(() => {
				this.jsonSearchComponent()?.focus();
				this.syncScroll();
			}, 10);
		}
	}

	syncScroll(event?: Event) {
		const editor = this.codeEditor()?.nativeElement;
		if (this.highlightOverlay() && editor) {
			this.highlightOverlay()!.nativeElement.scrollTop = editor.scrollTop;
			this.highlightOverlay()!.nativeElement.scrollLeft = editor.scrollLeft;
		}
		if (this.gutterEl() && editor) {
			this.gutterEl()!.nativeElement.scrollTop = editor.scrollTop;
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
		if (this.totalMatches > 0) this.scrollToMatch(0);
	}

	goToNextMatch() {
		if (this.totalMatches === 0) return;
		this.currentMatchIndex = (this.currentMatchIndex + 1) % this.totalMatches;
		this.scrollToMatch(this.currentMatchIndex);
	}

	goToPreviousMatch() {
		if (this.totalMatches === 0) return;
		this.currentMatchIndex = (this.currentMatchIndex - 1 + this.totalMatches) % this.totalMatches;
		this.scrollToMatch(this.currentMatchIndex);
	}

	private scrollToMatch(index: number) {
		const pos = this.matchPositions[index];
		if (!pos) return;
		const editor = this.codeEditor()?.nativeElement;
		if (!editor) return;
		const before = this.jsonText.substring(0, pos.start);
		const line = before.split('\n').length;
		const lineHeight = 20;
		editor.scrollTop = Math.max(0, (line - 5) * lineHeight);
	}

	// ─── Code Folding ──────────────────────────────────────────

	get codeFoldingEnabled(): boolean {
		return this.config()?.codeFolding !== false;
	}

	get hasFolds(): boolean {
		return this.foldStates.length > 0;
	}

	isFoldableLine(lineNumber: number): boolean {
		return this.codeFoldingEnabled && this.foldableLines.has(lineNumber);
	}

	isFoldedLine(lineNumber: number): boolean {
		return this.foldingService.isFolded(this.foldStates, lineNumber);
	}

	toggleFold(lineNumber: number) {
		if (this.isFoldedLine(lineNumber)) {
			const result = this.foldingService.unfoldRegion(this.jsonText, this.foldStates, lineNumber);
			this.jsonText = result.text;
			this.foldStates = result.folds;
		} else {
			const result = this.foldingService.foldRegion(this.jsonText, this.foldStates, lineNumber);
			this.jsonText = result.text;
			this.foldStates = result.folds;
		}
		this.updateFoldableLines();
		this.renderEditor();
		this.cdr.detectChanges();
		this.syncScroll();
	}

	foldAll() {
		if (!this.codeFoldingEnabled) return;
		const regions = this.foldingService.findFoldableRegions(this.jsonText);
		const topLevel = this.getTopLevelRegions(regions);
		let text = this.jsonText;
		let folds = [...this.foldStates];

		const sorted = [...topLevel].sort((a, b) => b.startLine - a.startLine);
		for (const region of sorted) {
			if (!this.foldingService.isFolded(folds, region.startLine)) {
				const result = this.foldingService.foldRegion(text, folds, region.startLine);
				text = result.text;
				folds = result.folds;
			}
		}

		this.jsonText = text;
		this.foldStates = folds;
		this.updateFoldableLines();
		this.renderEditor();
		this.cdr.detectChanges();
		this.syncScroll();
	}

	unfoldAllRegions() {
		const result = this.foldingService.unfoldAll(this.jsonText, this.foldStates);
		this.jsonText = result.text;
		this.foldStates = result.folds;
		this.updateFoldableLines();
		this.renderEditor();
		this.cdr.detectChanges();
		this.syncScroll();
	}

	private updateFoldableLines() {
		if (!this.codeFoldingEnabled || !this.jsonText) {
			this.foldableLines = new Set();
			return;
		}
		const regions = this.foldingService.findFoldableRegions(this.jsonText);
		this.foldableLines = new Set(regions.map(r => r.startLine));

		for (const fold of this.foldStates) {
			this.foldableLines.add(fold.startLine);
		}
	}

	private ensureUnfolded() {
		if (this.foldStates.length > 0) {
			const result = this.foldingService.unfoldAll(this.jsonText, this.foldStates);
			this.jsonText = result.text;
			this.foldStates = result.folds;
			this.updateFoldableLines();
		}
	}

	private getTopLevelRegions(regions: FoldRegion[]): FoldRegion[] {
		return regions.filter(r => {
			return !regions.some(other =>
				other !== r &&
				other.startLine < r.startLine &&
				other.endLine > r.endLine
			);
		});
	}
}
