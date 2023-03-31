import { App, DropdownComponent, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, EditorPosition, Setting } from 'obsidian';
import { Expansion, ExpansionEntrySetting } from 'ExpansionEntrySetting';


type EventsTriggeringExpand = 'ON_SPACE' | 'ON_ENTER';

const EventsTriggeringExpandMap = new Map<EventsTriggeringExpand, string>([
	['ON_SPACE', 'When hitting Space'],
	['ON_ENTER', 'When hitting Enter']
]); 

interface AbbreviationPluginSettings {
	abbreviations: Record<string, Expansion>;
	eventsTriggeringExpand: EventsTriggeringExpand;
}

interface AbbreviationLocation {
	position: EditorPosition;
	abbreviation: Expansion;
}

const DEFAULT_SETTINGS: AbbreviationPluginSettings = {
	abbreviations: {
		'eg.': {
			value: 'for example',
			isEnabled: true
		},
		'atm' : {
			value: 'at the moment',
			isEnabled: true
		},
		'imo' : {
			value: 'in my opinion',
			isEnabled: true
		},
		'w/'  : {
			value: 'with',
			isEnabled: true
		},
		'w/o' : {
			value: 'without',
			isEnabled: true
		},
		'ily' : {
			value: 'I love you',
			isEnabled: true
		},
		'k8s' : {
			value: 'Kubernetes',
			isEnabled: true
		},
		'rs'  : {
			value: 'Rust',
			isEnabled: true
		},
		'js'  : { 
			value: 'JavaScript',
			isEnabled: true
		},
		'ts'  : {
			value: 'TypeScript',
			isEnabled: true
		},
		'py'  : {
			value: 'Python',
			isEnabled: true
		}
	},
	eventsTriggeringExpand: 'ON_SPACE',
}

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
		console.log(`word: "${word}"`)
		
		if (word in this.settings.abbreviations)
			return {
				position: { line: position.line, ch: wordStart },
				abbreviation: this.settings.abbreviations[word]
			};
		
		return null;
	}

	async onload() {
		await this.loadSettings();
		
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'choose-abbreviation-expansion-mode',
			name: 'Choose how to expand abbreviations',
			callback: () => {
				new ChooseAbbreviationExpansionModal(this.app, this).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AbbreviationSettingTab(this.app, this));

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {

			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			const editor = view.editor;
			const position = editor.getCursor()
																					
			const line = editor.getLine(position.line).substring(0, position.ch) 
			
			if (
				event.code == 'Space' && this.settings.eventsTriggeringExpand === 'ON_SPACE'
//				|| event.code == 'Enter' && this.settings.eventsTriggeringExpand === 'ON_ENTER'
			) {
				const abbreviationLocation = this.detectAbbreviation(line, position);
				console.log(`abbreviation: ${JSON.stringify(abbreviationLocation)}`)
				if (abbreviationLocation?.abbreviation.isEnabled) {
					view.editor.replaceRange(abbreviationLocation.abbreviation.value, abbreviationLocation.position, position);
					return;
				}

			}
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ChooseAbbreviationExpansionModal extends Modal {
	plugin: AbbreviationPlugin;
	
	constructor(app: App, plugin: AbbreviationPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl} = this;
		const center = contentEl.createEl('div', {cls: ".center"} );
		
		new DropdownComponent(center)
			.addOptions(
				Object.fromEntries(EventsTriggeringExpandMap)
			)
			.setValue(this.plugin.settings.eventsTriggeringExpand)
			.onChange(async (value: EventsTriggeringExpand) => {
				this.plugin.settings.eventsTriggeringExpand = value;
				try {
					await this.plugin.saveSettings();
					new Notice('Settings changed ✅!');
				} catch (error) {
					new Notice('Error when saving settings! Check the logs');
					console.error(error);
				}
				this.close()
			})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
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
		containerEl.createEl('h2', {text: 'Abbreviations Plugin - Settings'});

		new Setting(containerEl)
			.setName('Event triggering expand')
			.setDesc('Event that triggers the expansion of abbreviations')
			.addDropdown(dropdown =>
				dropdown.addOptions(
					Object.fromEntries(EventsTriggeringExpandMap)
				)
				.setValue(this.plugin.settings.eventsTriggeringExpand)
				.onChange(async (value: EventsTriggeringExpand) => {
					this.plugin.settings.eventsTriggeringExpand = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h3', {text: 'Abbreviations list'});
		
		new Setting(containerEl)
			.setName('Abbreviations')
			.setDesc('Add abbreviations to be replaced in your notes')
			.addButton(addButton => 
				addButton
					.setIcon('plus')
					.onClick(() => {
						console.log('add button clicked')
						this.plugin.settings.abbreviations[''].value = '';
						this.display();
					})
			)
			.addExtraButton(resetButton =>
				resetButton
					.setIcon('reset')
					.setTooltip('Reset to defaults')
					.onClick(async () => {
						this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
						await this.plugin.saveSettings();
						this.display();
					})
			);


		// Here goes all the abbreviations entries
		Object.entries(this.plugin.settings.abbreviations).forEach((entry) => {
			const [ abbreviation, expansion ] = entry;
			new ExpansionEntrySetting(containerEl, {
				abbreviation,
				expansion,
				onRemove: async () => {
					delete this.plugin.settings.abbreviations[abbreviation];
					this.display();
					await this.plugin.saveSettings()
				},
				onAbbreviationEdit: async (newAbbreviation: string, oldAbbreviation: string) => {
					this.plugin.settings.abbreviations[newAbbreviation] = this.plugin.settings.abbreviations[abbreviation];
					delete this.plugin.settings.abbreviations[oldAbbreviation];
					this.display();
					await this.plugin.saveSettings()
				},
				onExpansionEdit: async (newExpansion: string) => {
					this.plugin.settings.abbreviations[abbreviation].value = newExpansion;
					await this.plugin.saveSettings()
				},
				onDisable: async (isEnabled: boolean) => {
					this.plugin.settings.abbreviations[abbreviation].isEnabled = isEnabled;
					await this.plugin.saveSettings()
					this.display();
				}
			})
		})

		delete this.plugin.settings.abbreviations[''];
		console.table(this.plugin.settings)
	}
}
