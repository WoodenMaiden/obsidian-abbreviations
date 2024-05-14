import {
	MarkdownView, 
	Plugin, 
	EditorPosition, 
} from 'obsidian';

import {
	AbbreviationPluginSettings,
	AbbreviationLocation,
	DEFAULT_SETTINGS,
} from './types';

import Devlogger from './util/Devlogger';
import SettingsTab from './ui/SettingsTab';


export default class AbbreviationPlugin extends Plugin {
	@Devlogger()
	private readonly logger: Console;
	
	settings: AbbreviationPluginSettings;

	/**
	 * Detects an abbreviation at the left of the cursor, returns its meaning and starting position
	 * returns null if no abbreviation is found
	 * 
	 * example (lets assume atm is in the list of abbreviations):
	 * 			               v cursor				
	 * > what are you doing atm|
	 * ☝️ this will detect atm
	 * 
	 * but not here:
	 * 							v cursor 
	 * > what are you doing atm |
	 * 
	 * @param line line of text 
	 * @param position position of the cursor
	 * @returns {AbbreviationLocation | null}
	 */
	private detectAbbreviation(line: string, position: EditorPosition): AbbreviationLocation | null {
		let wordStart = position.ch;
		
		do {
			const previous = (wordStart - 1 < 0)? 0: wordStart - 1;
			if (/\s/.test(line[previous])) break;

			--wordStart;
		} while (wordStart > 0);
		
		const word = line.substring(wordStart, position.ch);
		const wordAbbrv = Object.keys(this.settings.abbreviations)
			.find(k => k.toLocaleLowerCase() === word.toLocaleLowerCase())

		if (!wordAbbrv) return null;

		this.logger.log(`Abbreviation detected!: ${wordAbbrv}`);

		const wordEntry = this.settings.abbreviations[wordAbbrv];
		const sameCase = word === wordAbbrv;
		
		if (word !== "" && wordEntry?.value && (sameCase || !wordEntry.isCaseSensitive))
			return {
				position: { line: position.line, ch: wordStart },
				abbreviation: this.settings.abbreviations[wordAbbrv]
			};
		
		return null;
	}

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {

			this.logger.trace("Key pressed: ", event.code);

			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			const editor = view.editor;
			const position = editor.getCursor()
																					
			const line = editor.getLine(position.line).substring(0, position.ch) 
			
			if (event.code == 'Space') {
				const abbreviationLocation = this.detectAbbreviation(line, position);
				if (abbreviationLocation?.abbreviation.isEnabled) {
					view.editor.replaceRange(abbreviationLocation.abbreviation.value, abbreviationLocation.position, position);
					return;
				}

			}
		})
	}

	async loadSettings() {
		this.settings = { ...structuredClone(DEFAULT_SETTINGS), ...(await this.loadData())};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async resetSettings() {
		this.settings = { ...structuredClone(DEFAULT_SETTINGS) };
		await this.saveData(this.settings);
	}
}
