import { EditorPosition } from "obsidian";

export interface Expansion {
	value: string;
	isEnabled: boolean;
	position: number;
}

export interface AbbreviationPluginSettings {
	abbreviations: Record<string, Expansion>;
}

export interface AbbreviationLocation {
	position: EditorPosition;
	abbreviation: Expansion;
}

export const DEFAULT_SETTINGS: AbbreviationPluginSettings = {
	abbreviations: {
		'eg.': {
			value: 'for example',
			isEnabled: true,
			position: 0
		},
		'atm' : {
			value: 'at the moment',
			isEnabled: true,
			position: 1
		},
		'imo' : {
			value: 'in my opinion',
			isEnabled: true,
			position: 2
		},
		'w/'  : {
			value: 'with',
			isEnabled: true,
			position: 3
		},
		'w/o' : {
			value: 'without',
			isEnabled: true,
			position: 4
		},
		'ily' : {
			value: 'I love you',
			isEnabled: true,
			position: 5
		},
		'btw' : {
			value: 'by the way',
			isEnabled: true,
			position: 6
		},
		'afaik': {
			value: 'as far as I know',
			isEnabled: true,
			position: 7
		},
		'rn'  : {
			value: 'right now',
			isEnabled: true,
			position: 8
		}	
	},
}
