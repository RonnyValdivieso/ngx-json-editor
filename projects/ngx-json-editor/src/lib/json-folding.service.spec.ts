import { TestBed } from '@angular/core/testing';
import { JsonFoldingService, FoldState } from './json-folding.service';

describe('JsonFoldingService', () => {
	let service: JsonFoldingService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(JsonFoldingService);
	});

	const formattedJson = `{
  "name": "Ronny",
  "skills": [
    "Angular",
    "TypeScript"
  ],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}`;

	describe('findFoldableRegions', () => {
		it('should detect multi-line objects and arrays', () => {
			const regions = service.findFoldableRegions(formattedJson);
			expect(regions.length).toBeGreaterThanOrEqual(3);

			// Root object
			const root = regions.find(r => r.startLine === 1);
			expect(root).toBeTruthy();
			expect(root!.type).toBe('object');

			// skills array
			const skills = regions.find(r => r.type === 'array');
			expect(skills).toBeTruthy();

			// settings object
			const settings = regions.find(r => r.startLine > 5 && r.type === 'object');
			expect(settings).toBeTruthy();
		});

		it('should ignore single-line blocks', () => {
			const text = '{"a": 1, "b": [1, 2]}';
			const regions = service.findFoldableRegions(text);
			expect(regions.length).toBe(0);
		});

		it('should return empty for non-JSON text', () => {
			const regions = service.findFoldableRegions('hello world');
			expect(regions.length).toBe(0);
		});
	});

	describe('foldRegion', () => {
		it('should fold a multi-line object', () => {
			const regions = service.findFoldableRegions(formattedJson);
			const settingsRegion = regions.find(r => r.startLine > 5 && r.type === 'object');
			expect(settingsRegion).toBeTruthy();

			const result = service.foldRegion(formattedJson, [], settingsRegion!.startLine);
			expect(result.folds.length).toBe(1);
			expect(result.text).toContain('{…');
			expect(result.text).toContain('keys}');
			// The folded text should have fewer lines
			expect(result.text.split('\n').length).toBeLessThan(formattedJson.split('\n').length);
		});

		it('should not fold an already folded region', () => {
			const regions = service.findFoldableRegions(formattedJson);
			const settingsRegion = regions.find(r => r.startLine > 5 && r.type === 'object');
			const result1 = service.foldRegion(formattedJson, [], settingsRegion!.startLine);
			const result2 = service.foldRegion(result1.text, result1.folds, settingsRegion!.startLine);
			// Should be unchanged
			expect(result2.text).toBe(result1.text);
			expect(result2.folds.length).toBe(result1.folds.length);
		});

		it('should fold an array', () => {
			const regions = service.findFoldableRegions(formattedJson);
			const arrayRegion = regions.find(r => r.type === 'array');
			expect(arrayRegion).toBeTruthy();

			const result = service.foldRegion(formattedJson, [], arrayRegion!.startLine);
			expect(result.folds.length).toBe(1);
			expect(result.text).toContain('[…');
			expect(result.text).toContain('items]');
		});
	});

	describe('unfoldRegion', () => {
		it('should restore the original text', () => {
			const regions = service.findFoldableRegions(formattedJson);
			const settingsRegion = regions.find(r => r.startLine > 5 && r.type === 'object');

			const folded = service.foldRegion(formattedJson, [], settingsRegion!.startLine);
			const unfolded = service.unfoldRegion(folded.text, folded.folds, settingsRegion!.startLine);

			expect(unfolded.text).toBe(formattedJson);
			expect(unfolded.folds.length).toBe(0);
		});
	});

	describe('unfoldAll', () => {
		it('should restore all folds', () => {
			const regions = service.findFoldableRegions(formattedJson);
			// Fold the settings object (bottom first to avoid index issues)
			const settingsRegion = regions.find(r => r.startLine > 5 && r.type === 'object');
			const result1 = service.foldRegion(formattedJson, [], settingsRegion!.startLine);

			// Now fold the array
			const newRegions = service.findFoldableRegions(result1.text);
			const arrayRegion = newRegions.find(r => r.type === 'array');
			let result2 = result1;
			if (arrayRegion) {
				result2 = service.foldRegion(result1.text, result1.folds, arrayRegion.startLine);
			}

			// Unfold all
			const unfolded = service.unfoldAll(result2.text, result2.folds);
			expect(unfolded.folds.length).toBe(0);
			expect(unfolded.text).toBe(formattedJson);
		});
	});

	describe('isFolded', () => {
		it('should return true for a folded line', () => {
			const folds: FoldState[] = [{
				startLine: 5,
				originalContent: 'test',
				placeholder: '{…2 keys}',
				linesRemoved: 3
			}];
			expect(service.isFolded(folds, 5)).toBeTrue();
		});

		it('should return false for an unfolded line', () => {
			expect(service.isFolded([], 5)).toBeFalse();
		});
	});
});
