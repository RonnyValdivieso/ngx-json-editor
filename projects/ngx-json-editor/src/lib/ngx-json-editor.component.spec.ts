import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { NgxJsonEditorComponent } from './ngx-json-editor.component';

describe('NgxJsonEditorComponent', () => {
	let component: NgxJsonEditorComponent;
	let fixture: ComponentFixture<NgxJsonEditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [NgxJsonEditorComponent],
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

	it('should sync scroll from textarea to overlay', () => {
		// Attach to body to ensure layout and scroll works
		document.body.appendChild(fixture.nativeElement);

		component.showSearch = true;
		component.searchTerm = 'key';
		// Set large content to ensure scrolling is possible (scrollHeight > clientHeight)
		component.jsonText = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ key: `value ${i}` })), null, 2);
		fixture.detectChanges();

		// Mock elements
		const textarea = component.jsonArea.nativeElement;
		// We need to ensure highlightOverlay is set. In test env it might not be rendered unless showSearch is true (it is)
		// and change detection ran (it did).
		const overlay = component.highlightOverlay?.nativeElement;

		expect(overlay).toBeDefined();
		if (!overlay) return;

		// Force styles to ensure scrolling works despite test env CSS issues
		textarea.style.height = '100px';
		textarea.style.display = 'block';
		overlay.style.height = '100px';
		overlay.style.display = 'block';

		// Simulate scroll on textarea
		textarea.scrollTop = 100;
		// Ensure horizontal scroll is possible by keeping lines short or forcing wrap off
		// But in this test, let's just focus on vertical if horizontal is tricky with current content
		// or make content wider

		// Verify textarea accepted some scroll
		expect(textarea.scrollTop).toBeGreaterThan(0);

		// Trigger sync
		component.syncScroll();

		// Expect overlay to match textarea (whatever the browser allowed)
		expect(overlay.scrollTop).toBe(textarea.scrollTop);
		expect(overlay.scrollLeft).toBe(textarea.scrollLeft);

		// Cleanup
		document.body.removeChild(fixture.nativeElement);
	});
});
