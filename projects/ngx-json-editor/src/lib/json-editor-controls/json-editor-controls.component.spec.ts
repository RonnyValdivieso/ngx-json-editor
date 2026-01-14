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
		const button = fixture.nativeElement.querySelector('button'); // First button is usually Format
		// We can be more specific if we add IDs or classes, but checking text is fine for now
		const buttons = fixture.nativeElement.querySelectorAll('button');
		const formatBtn = Array.from(buttons).find((b: any) => b.textContent.includes('Formatear')) as HTMLButtonElement;

		formatBtn.click();
		expect(component.format.emit).toHaveBeenCalled();
	});

	it('should hide button if config says false', () => {
		component.config = {
			buttons: {
				format: false
			}
		};
		fixture.detectChanges();
		const buttons = fixture.nativeElement.querySelectorAll('button');
		const hasFormat = Array.from(buttons).some((b: any) => b.textContent.includes('Formatear'));
		expect(hasFormat).toBeFalse();
	});
});
