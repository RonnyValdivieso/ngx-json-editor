import { Injectable } from '@angular/core';

export interface FoldRegion {
	startLine: number;
	endLine: number;
	type: 'object' | 'array';
	childCount: number;
}

export interface FoldState {
	startLine: number;
	originalContent: string;
	placeholder: string;
	linesRemoved: number;
}

@Injectable({ providedIn: 'root' })
export class JsonFoldingService {

	/**
	 * Scans the text and finds all multi-line foldable regions ({ } and [ ]).
	 * Uses bracket matching to correctly handle nesting.
	 */
	findFoldableRegions(text: string): FoldRegion[] {
		const lines = text.split('\n');
		const regions: FoldRegion[] = [];
		const stack: { char: string; line: number }[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			for (const ch of line) {
				if (ch === '{' || ch === '[') {
					stack.push({ char: ch, line: i });
				} else if (ch === '}' || ch === ']') {
					const open = stack.pop();
					if (!open) continue;
					const expectedOpen = ch === '}' ? '{' : '[';
					if (open.char !== expectedOpen) continue;

					// Only foldable if it spans multiple lines
					if (open.line < i) {
						const type: 'object' | 'array' = open.char === '{' ? 'object' : 'array';
						const childCount = this.countChildren(lines, open.line, i, type);
						regions.push({
							startLine: open.line + 1, // 1-indexed
							endLine: i + 1,           // 1-indexed
							type,
							childCount
						});
					}
				}
			}
		}

		// Sort by startLine ascending for consistent processing
		regions.sort((a, b) => a.startLine - b.startLine);
		return regions;
	}

	/**
	 * Fold the region that starts at the given line number.
	 * Returns the new text and the updated fold states array.
	 */
	foldRegion(text: string, folds: FoldState[], lineNumber: number): { text: string; folds: FoldState[] } {
		// Don't fold if already folded at this line
		if (this.isFolded(folds, lineNumber)) {
			return { text, folds };
		}

		const regions = this.findFoldableRegions(text);
		const region = regions.find(r => r.startLine === lineNumber);
		if (!region) {
			return { text, folds };
		}

		const lines = text.split('\n');
		const startIdx = region.startLine - 1; // 0-indexed
		const endIdx = region.endLine - 1;     // 0-indexed

		// Lines to remove: everything between start and end (exclusive of start and end bracket lines)
		// But we keep the opening line and append the placeholder + closing bracket
		const startLine = lines[startIdx];
		const endLine = lines[endIdx];

		// Build placeholder text
		const label = region.type === 'object'
			? `{…${region.childCount} keys}`
			: `[…${region.childCount} items]`;

		// The original content includes everything from line after start to line before end (inclusive)
		const removedLines = lines.slice(startIdx + 1, endIdx + 1);
		const originalContent = removedLines.join('\n');

		// Build the folded line: keep start line but replace content
		// Find the opening bracket position and replace from there
		const openBracket = region.type === 'object' ? '{' : '[';
		const bracketPos = startLine.lastIndexOf(openBracket);
		const foldedLine = startLine.substring(0, bracketPos) + label;

		// Build new lines array
		const newLines = [
			...lines.slice(0, startIdx),
			foldedLine,
			...lines.slice(endIdx + 1)
		];

		const linesRemoved = endIdx - startIdx; // lines removed count

		const newFold: FoldState = {
			startLine: lineNumber,
			originalContent,
			placeholder: label,
			linesRemoved
		};

		// Adjust existing fold startLines that come after this fold
		const adjustedFolds = folds.map(f => {
			if (f.startLine > lineNumber) {
				return { ...f, startLine: f.startLine - linesRemoved };
			}
			return f;
		});

		return {
			text: newLines.join('\n'),
			folds: [...adjustedFolds, newFold]
		};
	}

	/**
	 * Unfold the region at the given line number.
	 */
	unfoldRegion(text: string, folds: FoldState[], lineNumber: number): { text: string; folds: FoldState[] } {
		const foldIndex = folds.findIndex(f => f.startLine === lineNumber);
		if (foldIndex === -1) {
			return { text, folds };
		}

		const fold = folds[foldIndex];
		const lines = text.split('\n');
		const startIdx = fold.startLine - 1; // 0-indexed

		// Safety: if startIdx is out of bounds, remove the stale fold
		if (startIdx < 0 || startIdx >= lines.length) {
			const remainingFolds = folds.filter((_, i) => i !== foldIndex);
			return { text, folds: remainingFolds };
		}

		// Current folded line — restore original
		const foldedLine = lines[startIdx];
		const placeholderPos = foldedLine.indexOf(fold.placeholder);

		if (placeholderPos === -1) {
			// Placeholder no longer present (text was edited), remove the fold state
			const remainingFolds = folds.filter((_, i) => i !== foldIndex);
			return { text, folds: remainingFolds };
		}

		// Restore the opening bracket (get prefix before placeholder)
		const prefix = foldedLine.substring(0, placeholderPos);
		const openBracket = fold.placeholder.startsWith('{') ? '{' : '[';
		const restoredStartLine = prefix + openBracket;

		// Build new lines array
		const restoredLines = fold.originalContent.split('\n');

		const newLines = [
			...lines.slice(0, startIdx),
			restoredStartLine,
			...restoredLines,
			...lines.slice(startIdx + 1)
		];

		// Remove this fold and adjust line numbers for folds after this one
		const linesRestored = fold.linesRemoved;
		const remainingFolds = folds
			.filter((_, i) => i !== foldIndex)
			.map(f => {
				if (f.startLine > lineNumber) {
					return { ...f, startLine: f.startLine + linesRestored };
				}
				return f;
			});

		return {
			text: newLines.join('\n'),
			folds: remainingFolds
		};
	}

	/**
	 * Unfold all folded regions. Processes from bottom to top to keep line numbering stable.
	 */
	unfoldAll(text: string, folds: FoldState[]): { text: string; folds: FoldState[] } {
		if (folds.length === 0) return { text, folds: [] };

		let result = { text, folds: [...folds] };
		let maxIterations = folds.length + 1; // Safety guard
		// Unfold from highest line number to lowest to avoid index shifting issues
		while (result.folds.length > 0 && maxIterations-- > 0) {
			const prevLength = result.folds.length;
			// Find the fold with the highest startLine
			const maxFold = result.folds.reduce((max, f) => f.startLine > max.startLine ? f : max, result.folds[0]);
			result = this.unfoldRegion(result.text, result.folds, maxFold.startLine);
			// If no folds were removed, something is wrong — break to avoid infinite loop
			if (result.folds.length >= prevLength) break;
		}

		return { text: result.text, folds: [] };
	}

	/**
	 * Check if a line has an active fold.
	 */
	isFolded(folds: FoldState[], lineNumber: number): boolean {
		return folds.some(f => f.startLine === lineNumber);
	}

	/**
	 * Count top-level children of an object or array block.
	 */
	private countChildren(lines: string[], startIdx: number, endIdx: number, type: 'object' | 'array'): number {
		// Simple heuristic: count commas at the top nesting level + 1
		// Or for objects, count top-level keys
		let depth = 0;
		let count = 0;
		const innerLines = lines.slice(startIdx + 1, endIdx);

		for (const line of innerLines) {
			for (const ch of line) {
				if (ch === '{' || ch === '[') depth++;
				else if (ch === '}' || ch === ']') depth--;
			}
			// A top-level child line at depth 0 that has meaningful content
			if (depth === 0) {
				const trimmed = line.trim();
				if (trimmed && trimmed !== ',' && trimmed !== '') {
					count++;
				}
			}
		}

		// Fallback: if count is 0, try counting by commas in the first level
		if (count === 0 && innerLines.length > 0) {
			count = innerLines.filter(l => l.trim().length > 0).length;
		}

		return count;
	}
}
