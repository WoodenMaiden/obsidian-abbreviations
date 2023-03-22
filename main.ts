import { App, DropdownComponent, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


type EventsTriggeringExpand = 'ON_SPACE' | 'ON_ENTER';

const EventsTriggeringExpandMap = new Map<EventsTriggeringExpand, string>([
	['ON_SPACE', 'When hitting Space'],
	['ON_ENTER', 'When hitting Enter']
]); 

interface AbbreviationPluginSettings {
	abbreviations: Record<string, string>;
	eventsTriggeringExpand: EventsTriggeringExpand;
}

const DEFAULT_SETTINGS: AbbreviationPluginSettings = {
	abbreviations: {
		'e.g.': 'for example',
		'atm' : 'at the moment',
		'imo' : 'in my opinion',
		'w/'  : 'with',
		'w/o' : 'without',
		'ily' : 'I love you',
		'mvc' : 'Model View Controller',
		'k8s' : 'Kubernetes',
		'rs'  : 'Rust',
		'js'  : 'JavaScript',
		'ts'  : 'TypeScript',
		'py'  : 'Python'
	},
	eventsTriggeringExpand: 'ON_SPACE',
}

export default class AbbreviationPlugin extends Plugin {
	settings: AbbreviationPluginSettings;

	async onload() {
		await this.loadSettings();
		
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'choose-abbreviation-expansion-mode',
			name: 'Choose how to expand abbrevations',
			callback: () => {
				new ChooseAbbreviationExpansionModal(this.app, this).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AbbreviationSettingTab(this.app, this));

	}

	onunload() {

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

		console.log('displaying settings tab', this.plugin.settings)
		
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Abbrevations Plugin - Settings'});

		new Setting(containerEl)
			.setName('Event triggering expand')
			.setDesc('Event that triggers the expansion of abbrevations')
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

		new Setting(containerEl)
			.setName('Abbrevations')
			.setDesc('Add abbrevations to be replaced in your notes')
			.addButton(addButton => 
				addButton
					.setIcon('plus')
					.onClick(async () => {
						console.log('add button clicked')
						this.plugin.settings.abbreviations[''] = '';
						this.plugin.saveSettings();
						this.display();
					})
			)

		Object.entries(this.plugin.settings.abbreviations).forEach((entry) => {
			const [ abbrevation, expansion ] = entry;

			// Abbrevation field
			new Setting(containerEl)
				.addText(textAreaAbbrev =>
					textAreaAbbrev
						.setPlaceholder('Abbrevation')
						.setValue(abbrevation)
						.onChange(async (value: string) => {
							delete this.plugin.settings.abbreviations[abbrevation];
							this.plugin.settings.abbreviations[value] = expansion;
							await this.plugin.saveSettings();
						}
					)
				)
			// Expansion field
				.addText(textAreaExpansion =>
					textAreaExpansion
						.setPlaceholder('Meaning')
						.setValue(expansion)
						.onChange(async (value: string) => {
							this.plugin.settings.abbreviations[abbrevation] = value;
							await this.plugin.saveSettings();
						}
					)
				)
			// Remove button
				.addButton(removeButton =>
					removeButton
						.setIcon('cross')
						.onClick(async () => {
							delete this.plugin.settings.abbreviations[abbrevation];
							await this.plugin.saveSettings();
							this.display();
						}
					)
				)
				
		})
	}
}
