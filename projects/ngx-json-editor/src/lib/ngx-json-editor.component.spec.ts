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
		component.initialValue = '{"key": "value"}';
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
		component.config = undefined;
		const labels = component.labels;
		expect(labels.format).toBe('Format');
		expect(labels.valid).toBe('Valid');
		expect(labels.placeholder).toBe('Paste your JSON here...');
	});

	it('should override labels via config', () => {
		component.config = {
			labels: {
				format: 'Formatear',
				valid: 'Válido',
			}
		};
		const labels = component.labels;
		expect(labels.format).toBe('Formatear');
		expect(labels.valid).toBe('Válido');
		// Non-overridden labels should still be defaults
		expect(labels.copy).toBe('Copy');
	});

	it('should not steal focus when searching', () => {
		component.jsonText = JSON.stringify({ test: 'value' });
		component.showSearch = true;
		fixture.detectChanges();

		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();
		expect(document.activeElement).toBe(input);

		component.onSearchTermChange('test');

		expect(document.activeElement).toBe(input);

		const textarea = component.jsonArea.nativeElement;
		expect(textarea.selectionStart).not.toEqual(textarea.selectionEnd);

		document.body.removeChild(input);
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

	it('should sync scroll from textarea to overlay', (done) => {
		component.showSearch = true;
		component.searchTerm = 'key';
		const largeJson = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ key: `value ${i}` })), null, 2);

		component.initialValue = largeJson;
		component.ngOnInit();
		fixture.detectChanges();

		const textarea = component.jsonArea.nativeElement;
		const overlay = component.highlightOverlay?.nativeElement;

		expect(overlay).toBeDefined();
		if (!overlay) {
			done();
			return;
		}

		textarea.style.height = '100px';
		textarea.style.display = 'block';
		overlay.style.height = '100px';
		overlay.style.display = 'block';

		setTimeout(() => {
			textarea.scrollTop = 100;
			expect(textarea.scrollTop).toBeGreaterThan(0);

			component.syncScroll();

			expect(overlay.scrollTop).toBe(textarea.scrollTop);
			expect(overlay.scrollLeft).toBe(textarea.scrollLeft);

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
		component.config = {
			buttons: {
				format: false
			}
		};
		fixture.detectChanges();

		const controls = fixture.nativeElement.querySelector('ngx-json-editor-controls');
		expect(controls).toBeTruthy();

		const buttons = controls.querySelectorAll('button');
		const hasFormat = Array.from(buttons).some((b: any) => b.title === 'Format');
		expect(hasFormat).toBeFalse();
	});

	it('should auto-indent on Enter', async () => {
		const textarea = component.jsonArea.nativeElement;
		component.jsonText = '  "key": "value"';
		fixture.detectChanges();
		await fixture.whenStable();
		
		textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		component.handleKeyDown(event);

		expect(component.jsonText).toBe('  "key": "value"\n  ');
	});

	it('should add extra indentation after {', async () => {
		const textarea = component.jsonArea.nativeElement;
		component.jsonText = '{';
		fixture.detectChanges();
		await fixture.whenStable();
		
		textarea.selectionStart = textarea.selectionEnd = 1;

		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		component.handleKeyDown(event);

		expect(component.jsonText).toBe('{\n  ');
	});

	it('should expand block when Enter between {}', async () => {
		const textarea = component.jsonArea.nativeElement;
		component.jsonText = '{}';
		fixture.detectChanges();
		await fixture.whenStable();

		textarea.focus();
		textarea.selectionStart = textarea.selectionEnd = 1;

		const event = new KeyboardEvent('keydown', { key: 'Enter' });
		component.handleKeyDown(event);

		expect(component.jsonText).toBe('{\n  \n}');
	});

	it('should un-indent with Shift+Tab', async () => {
		const textarea = component.jsonArea.nativeElement;
		component.jsonText = '  "key": "value"';
		fixture.detectChanges();
		await fixture.whenStable();

		textarea.focus();
		// Set cursor after the spaces
		textarea.selectionStart = textarea.selectionEnd = 2;

		const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
		component.handleKeyDown(event);

		expect(component.jsonText).toBe('"key": "value"');
	});
});
