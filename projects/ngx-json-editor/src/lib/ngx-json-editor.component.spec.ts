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
		component.initialValue = '{"key": "value"}';
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should not steal focus when searching', () => {
		component.jsonText = JSON.stringify({ test: 'value' });
		component.showSearch = true;
		fixture.detectChanges();

		// Create a dummy input to hold focus
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();
		expect(document.activeElement).toBe(input);

		// Trigger search
		component.onSearchTermChange('test');

		// Validate focus is still on input
		expect(document.activeElement).toBe(input);

		// Validate that textarea selection WAS set (meaning selectMatch was called)
		const textarea = component.jsonArea.nativeElement;
		// 'test' is 4 chars, found at specific index.
		// {"test":"value"}
		// 0123456789...
		// "test" starts at 2
		expect(textarea.selectionStart).not.toEqual(textarea.selectionEnd);

		document.body.removeChild(input);
	});

	it('should highlight the active match differently', () => {
		const text = 'test test test';
		const term = 'test';
		// Active index 1 (second match)
		const result = component.highlightSearchTerm(text, term, 1) as unknown as string;

		// Should have 3 matches
		const matches = result.match(/<span/g);
		expect(matches?.length).toBe(3);

		// Check for orange style on the 2nd match (index 1)
		// We expect the string to contain background-color: #f97316
		const activeMatches = result.match(/background-color: #f97316/g);
		expect(activeMatches?.length).toBe(1);

		// Verify others are yellow (#fde047)
		const inactiveMatches = result.match(/background-color: #fde047/g);
		expect(inactiveMatches?.length).toBe(2);
	});

	it('should sync scroll from textarea to overlay', (done) => {
		// Attach to body to ensure layout and scroll works
		document.body.appendChild(fixture.nativeElement);

		component.showSearch = true;
		component.searchTerm = 'key';
		// Set large content to ensure scrolling is possible
		const largeJson = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ key: `value ${i}` })), null, 2);

		// Set input and trigger change
		component.initialValue = largeJson;
		component.ngOnInit(); // Re-run init to set jsonText
		fixture.detectChanges();

		// Mock elements
		const textarea = component.jsonArea.nativeElement;
		const overlay = component.highlightOverlay?.nativeElement;

		expect(overlay).toBeDefined();
		if (!overlay) {
			document.body.removeChild(fixture.nativeElement);
			done();
			return;
		}

		// Force styles
		textarea.style.height = '100px';
		textarea.style.display = 'block';
		overlay.style.height = '100px';
		overlay.style.display = 'block';

		// Allow layout to settle
		setTimeout(() => {
			// Simulate scroll on textarea
			textarea.scrollTop = 100;

			// Verify textarea accepted some scroll
			expect(textarea.scrollTop).toBeGreaterThan(0);

			// Trigger sync
			component.syncScroll();

			// Expect overlay to match
			expect(overlay.scrollTop).toBe(textarea.scrollTop);
			expect(overlay.scrollLeft).toBe(textarea.scrollLeft);

			// Cleanup
			document.body.removeChild(fixture.nativeElement);
			done();
		}, 100);
	});

	it('should toggle search visibility when toggleSearch is called', () => {
		// Initial state: false
		expect(component.showSearch).toBeFalse();

		// Toggle ON
		component.toggleSearch();
		expect(component.showSearch).toBeTrue();

		// Toggle OFF
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

		// Check integration: Ensure controls component wraps buttons
		const controls = fixture.nativeElement.querySelector('ngx-json-editor-controls');
		expect(controls).toBeTruthy();

		// Verify button absence inside the child component
		const buttons = controls.querySelectorAll('button');
		const hasFormat = Array.from(buttons).some((b: any) => b.textContent.includes('Formatear'));
		expect(hasFormat).toBeFalse();
	});
});
