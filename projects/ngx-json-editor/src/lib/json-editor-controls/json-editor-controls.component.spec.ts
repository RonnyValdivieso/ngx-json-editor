import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonEditorControlsComponent } from './json-editor-controls.component';

describe('JsonEditorControlsComponent', () => {
	let component: JsonEditorControlsComponent;
	let fixture: ComponentFixture<JsonEditorControlsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [JsonEditorControlsComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(JsonEditorControlsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should emit format event when format button is clicked', () => {
		spyOn(component.format, 'emit');
		const buttons = fixture.nativeElement.querySelectorAll('button');
		const formatBtn = Array.from(buttons).find((b: any) => b.title === 'Format') as HTMLButtonElement;

		expect(formatBtn).toBeTruthy();
		formatBtn.click();
		expect(component.format.emit).toHaveBeenCalled();
	});

	it('should hide button if config says false', () => {
		fixture.componentRef.setInput('config', {
			buttons: {
				format: false
			}
		});
		fixture.detectChanges();
		const buttons = fixture.nativeElement.querySelectorAll('button');
		const hasFormat = Array.from(buttons).some((b: any) => b.title === 'Format');
		expect(hasFormat).toBeFalse();
	});

	it('should display all buttons by default', () => {
		const buttons = fixture.nativeElement.querySelectorAll('.nje-controls__btn');
		// 10 buttons: format, minify, sort, search, foldAll, unfoldAll, copy, download, upload, reset
		expect(buttons.length).toBe(10);
	});

	it('should have correct tooltip titles from labels', () => {
		const buttons = fixture.nativeElement.querySelectorAll('.nje-controls__btn');
		const titles = Array.from(buttons).map((b: any) => b.title);
		expect(titles).toContain('Format');
		expect(titles).toContain('Minify');
		expect(titles).toContain('Sort keys');
		expect(titles).toContain('Search');
		expect(titles).toContain('Copy');
		expect(titles).toContain('Download');
		expect(titles).toContain('Upload');
		expect(titles).toContain('Reset');
		expect(titles).toContain('Fold all');
		expect(titles).toContain('Unfold all');
	});
});
