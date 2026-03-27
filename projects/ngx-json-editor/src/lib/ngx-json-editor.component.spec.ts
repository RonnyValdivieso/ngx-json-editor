import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { NgxJsonEditorComponent } from './ngx-json-editor.component';
import { JsonEditorControlsComponent } from './json-editor-controls/json-editor-controls.component';

describe('NgxJsonEditorComponent', () => {
	let component: NgxJsonEditorComponent;
	let fixture: ComponentFixture<NgxJsonEditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [NgxJsonEditorComponent, JsonEditorControlsComponent],
			providers: [
				{
					provide: DomSanitizer,
					useValue: {
						bypassSecurityTrustHtml: (val: string) => val,
						sanitize: (ctx: any, val: any) => val
					}
				}
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(NgxJsonEditorComponent);
		component = fixture.componentInstance;
		document.body.appendChild(fixture.nativeElement);
		fixture.componentRef.setInput('initialValue', '{"key": "value"}');
		fixture.detectChanges();
	});

	afterEach(() => {
		document.body.removeChild(fixture.nativeElement);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should generate correct line numbers', async () => {
		component.jsonText = '{\n  "a": 1,\n  "b": 2\n}';
		fixture.detectChanges();
		await fixture.whenStable();
		const lines = component.lineNumbers;
		expect(lines.length).toBe(4);
		expect(lines).toEqual([1, 2, 3, 4]);
	});

	it('should return default labels when no config provided', () => {
		fixture.componentRef.setInput('config', undefined);
		const labels = component.labels;
		expect(labels.format).toBe('Format');
		expect(labels.valid).toBe('Valid');
		expect(labels.placeholder).toBe('Paste your JSON here...');
	});

	it('should override labels via config', () => {
		fixture.componentRef.setInput('config', {
			labels: {
				format: 'Formatear',
				valid: 'Válido',
			}
		});
		const labels = component.labels;
		expect(labels.format).toBe('Formatear');
		expect(labels.valid).toBe('Válido');
		expect(labels.copy).toBe('Copy');
	});

	it('should render content in the contenteditable editor', async () => {
		component.jsonText = '{"test": 1}';
		component.renderEditor();
		fixture.detectChanges();
		await fixture.whenStable();
		const editor = component.codeEditor()!.nativeElement;
		expect(editor.innerText).toContain('"test"');
	});

	it('should highlight the active match differently', () => {
		const text = 'test test test';
		const term = 'test';
		const result = component.highlightSearchTerm(text, term, 1) as unknown as string;

		const matches = result.match(/<span/g);
		expect(matches?.length).toBe(3);

		const activeMatches = result.match(/--nje-match-active, #f97316/g);
		expect(activeMatches?.length).toBe(1);

		const inactiveMatches = result.match(/--nje-match, #fde047/g);
		expect(inactiveMatches?.length).toBe(2);
	});

	it('should sync scroll from editor to overlay', (done) => {
		component.showSearch = true;
		component.searchTerm = 'key';
		const largeJson = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ key: `value ${i}` })), null, 2);

		fixture.componentRef.setInput('initialValue', largeJson);
		component.ngOnInit();
		component.renderEditor();
		fixture.detectChanges();

		const editor = component.codeEditor()!.nativeElement;
		const overlay = component.highlightOverlay()?.nativeElement;

		expect(overlay).toBeDefined();
		if (!overlay) {
			done();
			return;
		}

		editor.style.height = '100px';
		editor.style.display = 'block';
		overlay.style.height = '100px';
		overlay.style.display = 'block';

		setTimeout(() => {
			editor.scrollTop = 100;
			expect(editor.scrollTop).toBeGreaterThan(0);

			component.syncScroll();

			expect(overlay.scrollTop).toBe(editor.scrollTop);
			expect(overlay.scrollLeft).toBe(editor.scrollLeft);

			done();
		}, 100);
	});

	it('should toggle search visibility when toggleSearch is called', () => {
		expect(component.showSearch).toBeFalse();
		component.toggleSearch();
		expect(component.showSearch).toBeTrue();
		component.toggleSearch();
		expect(component.showSearch).toBeFalse();
	});

	it('should hide buttons based on config', () => {
		fixture.componentRef.setInput('config', {
			buttons: {
				format: false
			}
		});
		fixture.detectChanges();

		const controls = fixture.nativeElement.querySelector('ngx-json-editor-controls');
		expect(controls).toBeTruthy();

		const buttons = controls.querySelectorAll('button');
		const hasFormat = Array.from(buttons).some((b: any) => b.title === 'Format');
		expect(hasFormat).toBeFalse();
	});

	it('should validate JSON and set error state', () => {
		component.jsonText = '{"valid": true}';
		expect(component.validateJson(component.jsonText)).toBeTrue();
		expect(component.isValid).toBeTrue();

		component.jsonText = '{invalid json}';
		expect(component.validateJson(component.jsonText)).toBeFalse();
		expect(component.isValid).toBeFalse();
		expect(component.error).toBeTruthy();
	});

	it('should format JSON correctly', () => {
		component.jsonText = '{"a":1,"b":2}';
		component.formatJson();
		expect(component.jsonText).toBe('{\n  "a": 1,\n  "b": 2\n}');
	});

	it('should minify JSON correctly', () => {
		component.jsonText = '{\n  "a": 1,\n  "b": 2\n}';
		component.minifyJson();
		expect(component.jsonText).toBe('{"a":1,"b":2}');
	});

	it('should render fold badges for folded regions', () => {
		const json = '{\n  "settings": {\n    "theme": "dark"\n  }\n}';
		component.jsonText = json;
		
		// Fold the settings object (line 2)
		const result = (component as any).foldingService.foldRegion(json, [], 2);
		component.jsonText = result.text;
		component.foldStates = result.folds;
		component.renderEditor();
		fixture.detectChanges();

		const editor = component.codeEditor()!.nativeElement;
		const badge = editor.querySelector('.nje-fold-badge');
		expect(badge).toBeTruthy();
		expect(badge?.getAttribute('contenteditable')).toBe('false');
	});

	it('should use contenteditable div instead of textarea', () => {
		const editor = component.codeEditor()!.nativeElement;
		expect(editor.tagName).toBe('DIV');
		expect(editor.getAttribute('contenteditable')).toBe('true');

		const textarea = fixture.nativeElement.querySelector('textarea');
		expect(textarea).toBeNull();
	});
});
