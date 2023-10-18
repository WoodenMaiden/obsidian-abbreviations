import {
	App, 
	MarkdownView, 
	Plugin, 
	PluginSettingTab, 
	EditorPosition, 
	Setting,
	Notice
} from 'obsidian';

import {
	AbbreviationPluginSettings,
	AbbreviationLocation,
	DEFAULT_SETTINGS,
	Expansion
} from './types';

import { ExpansionEntrySetting } from './components/ExpansionEntrySetting';
import { ConfirmationModal } from './components/ConfirmationModal';


export default class AbbreviationPlugin extends Plugin {
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
		
		if (
			word !== "" && 
			this.settings.abbreviations[word]?.value && 
			word in this.settings.abbreviations
		)
			return {
				position: { line: position.line, ch: wordStart },
				abbreviation: this.settings.abbreviations[word]
			};
		
		return null;
	}

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new AbbreviationSettingTab(this.app, this));

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {

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
		console.log("Saving", this.settings);
		await this.saveData(this.settings);
	}

	async resetSettings() {
		console.log("Resetting!", this.settings)

		this.settings = { ...structuredClone(DEFAULT_SETTINGS) };
		await this.saveData(this.settings);
	}
}


class AbbreviationSettingTab extends PluginSettingTab {
	plugin: AbbreviationPlugin;

	constructor(app: App, plugin: AbbreviationPlugin) {
		super(app, plugin);
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h1', {text: 'Abbreviations Plugin - Settings'});

		new Setting(containerEl)
			.setName('Abbreviations')
			.setDesc('Add abbreviations to be replaced in your notes')
			.addButton(addButton => 
				addButton
					.setIcon('plus')
					.onClick(async () => {
						if ("" in this.plugin.settings.abbreviations) return;

						this.plugin.settings.abbreviations[''] = {
							value: '',
							isEnabled: true,
							position: 0
						};

						const offsetted: Record<string, Expansion> = Object.fromEntries(
							Object.entries(this.plugin.settings.abbreviations).map(
								([abbreviation, expansion]) => {
									return [abbreviation, {
										...expansion,
										position: !abbreviation? 
											expansion.position: 
											expansion.position + 1
									}]
								}
						));

						this.plugin.settings.abbreviations = offsetted;

						await this.plugin.saveSettings()
						this.display();
					})
			)
			.addExtraButton(resetButton =>
				resetButton
					.setIcon('reset')
					.setTooltip('Reset to defaults')
					.onClick(async () => {
						new ConfirmationModal(this.app, () => {
							this.plugin.resetSettings()
							this.display();
						}).open();
					})
			);


		// Here goes all the abbreviations entries
		const listEl = containerEl.createEl("ul")
		Object.entries(this.plugin.settings.abbreviations)
			.sort((a,b) => a[1].position - b[1].position)
			.forEach((entry) => {
				const [ abbreviation, expansion ] = entry;
				new ExpansionEntrySetting(listEl, {
					abbreviation,
					expansion,
					onRemove: async () => {
						delete this.plugin.settings.abbreviations[abbreviation];

						// update positions
						const updated: Record<string, Expansion> = Object.fromEntries(
							Object.entries(this.plugin.settings.abbreviations)
							.filter(e => expansion.position < e[1].position)
							.map(
								([abbreviation, expansion]) => {
									return [abbreviation, {
										...expansion,
										position: !abbreviation? 
											expansion.position: 
											expansion.position - 1
									}]
								}
							)
						) 

						this.plugin.settings.abbreviations = { 
							...this.plugin.settings.abbreviations, 
							...updated 
						};


						this.display();
						await this.plugin.saveSettings()
					},
					onAbbreviationEdit: async (newAbbreviation: string, oldAbbreviation: string) => {
						newAbbreviation = newAbbreviation.trim();
						if (newAbbreviation in this.plugin.settings.abbreviations) {
							new Notice(`⚠️ Abbreviation ${newAbbreviation} already exists\nThis change will not be saved`);
							return;
						}
							
						
						this.plugin.settings.abbreviations[newAbbreviation] = this.plugin.settings.abbreviations[abbreviation];
						delete this.plugin.settings.abbreviations[oldAbbreviation];
						
						this.display();
						await this.plugin.saveSettings()
					},
					onExpansionEdit: async (newExpansion: string) => {
						newExpansion = newExpansion.trim();
						this.plugin.settings.abbreviations[abbreviation].value = newExpansion;

						if (!newExpansion) {
							new Notice(`⚠️ Expansion cannot be empty\nThis change will be saved but not applied`);
							return;
						}
						
						await this.plugin.saveSettings()
					},
					onDisable: async (isEnabled: boolean) => {
						this.plugin.settings.abbreviations[abbreviation].isEnabled = isEnabled;
						await this.plugin.saveSettings()
						this.display();
					}
				})
			})
	}
}
