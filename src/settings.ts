// "" = use Obsidian default for that theme.
export interface ThemedColors {
	fontColorLight: string;
	bgColorLight: string;
	fontColorDark: string;
	bgColorDark: string;
}

export interface ColorCombo extends ThemedColors {
	id: string;
	name: string;
	applyToTab?: boolean;
}

export interface FileColorEntry {
	path: string;
	comboId: string;
}

export interface RegexRule extends ThemedColors {
	id: string;
	name: string;
	pattern: string;
	appliesTo: 'files' | 'folders' | 'both';
	/**
	 * What the pattern is tested against. 'name' (the default, and what older
	 * settings files imply) uses the file basename / folder name; 'path' uses
	 * the full vault path with the file extension stripped, so patterns can
	 * match e.g. "Classes/2026/Bio/Bio Notes".
	 */
	matchTarget?: 'name' | 'path';
	applyToTab?: boolean;
	/** Whether formatting applies to the Navigation Panel; undefined/absent means true (legacy default). */
	applyToNav?: boolean;
}

export interface ConditionalRule extends ThemedColors {
	id: string;
	name: string;
	folderPattern: string;
	filePattern: string;
	condition: 'max' | 'min';
	applyToTab?: boolean;
}

export interface YamlRule extends ThemedColors {
	id: string;
	name: string;
	key: string;
	value: string;
}

// Highlights one exact folder path (not its contents) with its own colors.
// Same priority tier as explicit right-click assignments; hierarchy still
// overrides both.
export interface FolderHighlightRule extends ThemedColors {
	id: string;
	path: string;
}

export interface FileFolderHighlighterSettings {
	colorCombos: ColorCombo[];
	fileColors: FileColorEntry[];
	hierarchyEnabled: boolean;
	hierarchyFontColorLight: string;
	hierarchyBgColorLight: string;
	hierarchyFontColorDark: string;
	hierarchyBgColorDark: string;
	activeFileHighlightEnabled: boolean;
	activeFileFontColorLight: string;
	activeFileBgColorLight: string;
	activeFileFontColorDark: string;
	activeFileBgColorDark: string;
	regexRules: RegexRule[];
	yamlRules: YamlRule[];
	conditionalRules: ConditionalRule[];
	folderHighlightRules: FolderHighlightRule[];
}

export const DEFAULT_SETTINGS: FileFolderHighlighterSettings = {
	colorCombos: [],
	fileColors: [],
	hierarchyEnabled: false,
	hierarchyFontColorLight: '#ffffff',
	hierarchyBgColorLight: '#2c7be5',
	hierarchyFontColorDark: '#ffffff',
	hierarchyBgColorDark: '#2c7be5',
	activeFileHighlightEnabled: false,
	activeFileFontColorLight: '#ffffff',
	activeFileBgColorLight: '#e67e22',
	activeFileFontColorDark: '#ffffff',
	activeFileBgColorDark: '#e67e22',
	regexRules: [],
	yamlRules: [],
	conditionalRules: [],
	folderHighlightRules: [],
};

/**
 * Pre-1.3.0 data used a single fontColor/bgColor pair per entry. Lifts any
 * such legacy fields onto the new Light/Dark pair (same color for both
 * themes, matching prior behavior) so existing data.json files keep working.
 */
function migrateThemedColors(entry: Record<string, unknown>): Record<string, unknown> {
	const out = { ...entry };
	const legacyFont = out['fontColor'];
	if (typeof legacyFont === 'string') {
		if (out['fontColorLight'] === undefined) out['fontColorLight'] = legacyFont;
		if (out['fontColorDark'] === undefined) out['fontColorDark'] = legacyFont;
		delete out['fontColor'];
	}
	const legacyBg = out['bgColor'];
	if (typeof legacyBg === 'string') {
		if (out['bgColorLight'] === undefined) out['bgColorLight'] = legacyBg;
		if (out['bgColorDark'] === undefined) out['bgColorDark'] = legacyBg;
		delete out['bgColor'];
	}
	return out;
}

export function migrateSettings(raw: unknown): FileFolderHighlighterSettings {
	const data: Record<string, unknown> = { ...(raw as Record<string, unknown> | null) };

	for (const key of [
		'colorCombos',
		'regexRules',
		'yamlRules',
		'conditionalRules',
		'folderHighlightRules',
	] as const) {
		const arr = data[key];
		if (Array.isArray(arr)) {
			data[key] = arr.map((entry) => migrateThemedColors(entry as Record<string, unknown>));
		}
	}

	const legacyHierarchyFont = data['hierarchyFontColor'];
	if (typeof legacyHierarchyFont === 'string') {
		if (data['hierarchyFontColorLight'] === undefined)
			data['hierarchyFontColorLight'] = legacyHierarchyFont;
		if (data['hierarchyFontColorDark'] === undefined)
			data['hierarchyFontColorDark'] = legacyHierarchyFont;
		delete data['hierarchyFontColor'];
	}
	const legacyHierarchyBg = data['hierarchyBgColor'];
	if (typeof legacyHierarchyBg === 'string') {
		if (data['hierarchyBgColorLight'] === undefined)
			data['hierarchyBgColorLight'] = legacyHierarchyBg;
		if (data['hierarchyBgColorDark'] === undefined)
			data['hierarchyBgColorDark'] = legacyHierarchyBg;
		delete data['hierarchyBgColor'];
	}

	return Object.assign({}, DEFAULT_SETTINGS, data);
}

// Drops a trailing file extension from a vault path, leaving the directories
// intact: "Classes/2026/Bio/Bio Notes.md" → "Classes/2026/Bio/Bio Notes".
// A dot in a folder name, or a leading-dot filename, is left alone.
export function stripExtension(path: string): string {
	const slash = path.lastIndexOf('/');
	const dot = path.lastIndexOf('.');
	return dot > slash + 1 ? path.slice(0, dot) : path;
}
