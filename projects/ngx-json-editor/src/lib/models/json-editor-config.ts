export interface JsonEditorLabels {
	format?: string;
	minify?: string;
	sort?: string;
	search?: string;
	copy?: string;
	download?: string;
	upload?: string;
	reset?: string;
	valid?: string;
	error?: string;
	placeholder?: string;
	lines?: string;
	characters?: string;
	noResults?: string;
	searchPlaceholder?: string;
	of?: string;
}

export const DEFAULT_LABELS: Required<JsonEditorLabels> = {
	format: 'Format',
	minify: 'Minify',
	sort: 'Sort keys',
	search: 'Search',
	copy: 'Copy',
	download: 'Download',
	upload: 'Upload',
	reset: 'Reset',
	valid: 'Valid',
	error: 'Error',
	placeholder: 'Paste your JSON here...',
	lines: 'Lines',
	characters: 'Characters',
	noResults: 'No results',
	searchPlaceholder: 'Search in JSON...',
	of: 'of',
};

export interface JsonEditorConfig {
	buttons?: {
		format?: boolean;
		minify?: boolean;
		sort?: boolean;
		search?: boolean;
		copy?: boolean;
		download?: boolean;
		reset?: boolean;
		load?: boolean;
	};
	labels?: JsonEditorLabels;
}
