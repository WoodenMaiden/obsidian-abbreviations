import { SelectionRange, Transaction } from '@codemirror/state';
import { EditorView, PluginValue, ViewUpdate } from '@codemirror/view';


import {
	AbbreviationLocation,
	AbbreviationPluginSettings,
	Expansion
} from '../types';

import Devlogger from '../util/Devlogger';

export class AbbreviationExpanderPlugin implements PluginValue {
	@Devlogger()
	private readonly logger: Console;
	


	constructor(
		private view: EditorView, 
		private settings: AbbreviationPluginSettings
	) {}
	
	
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
	 * @param document Document
	 * @param position position of the cursor
	 * @param abbreviations list of abbreviations
	 * @returns {AbbreviationLocation | null}
	 */
	private detectAbbreviation(
		editorText: string,
		position: number, 
		abbreviations: Record<string, Expansion>
	): AbbreviationLocation | null {
		let wordStart = position;
		
		do {
			const previous = (wordStart - 1 < 0)? 0: wordStart - 1;
			if (/\s/.test(editorText.substring(previous, position))) break;

			--wordStart;
		} while (wordStart > 0);
		
		const word = editorText.substring(wordStart, position);
		const wordAbbrv = Object.keys(this.settings.abbreviations)
			.find(k => k.toLocaleLowerCase() === word.toLocaleLowerCase())

		if (!wordAbbrv) return null;

		const wordEntry = abbreviations[wordAbbrv];
		const sameCase = word === wordAbbrv;
		
		if (word !== "" && wordEntry?.value && (sameCase || !wordEntry.isCaseSensitive))
			return {
				startingCharacter: wordStart,
				abbreviation: this.settings.abbreviations[wordAbbrv]
			};
		
		return null;
	}
	
	private isCursor(selection: SelectionRange): boolean {
		return selection.from == selection.to;
	}

	private inputIsSpace(tr: Transaction): boolean {
		let hasSpaceInsert = false;
		tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, insert) => {
			if (insert.length === 1 && insert.toString() === " ") {
				hasSpaceInsert = true;
			}
		});
		return hasSpaceInsert;
	}

	update(update: ViewUpdate): void {
		const input = update.transactions.at(-1);

		// check if update is the typing of a single space	
		if (input && input.isUserEvent("input.type") && this.inputIsSpace(input)) { 
			const cursorPosition = update.view.state.selection.main.head;
			this.logger.log("Doc:", update.view.state.doc.toString());
			this.logger.log("Selection:", update.view.state.wordAt(cursorPosition - 1));


			const abbreviation = this.detectAbbreviation(
				update.view.state.doc.toString(), 
				cursorPosition - 1, // we substract one to get the position of the word
				this.settings.abbreviations
			);

			if (!abbreviation) return;

			this.logger.log('found abbreviation:', abbreviation.abbreviation.value);

			requestAnimationFrame(() => { // to defer the dispatch to the next frame
				update.view.dispatch({
                    changes: {
                        from: abbreviation.startingCharacter,
                        to: cursorPosition,
                        insert: abbreviation.abbreviation.value + " ",
                    },
                });
			})
		}
	}
}
