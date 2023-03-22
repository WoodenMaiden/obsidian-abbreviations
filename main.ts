import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

type EventsTriggeringExpand = 'ON_SPACE' | 'ON_ENTER';

const EventsTriggeringExpandMap = new Map<EventsTriggeringExpand, string>([
	['ON_SPACE', 'Hitting Space'],
	['ON_ENTER', 'Hitting Enter']
]); 

interface MyPluginSettings {
	abbreviations: Map<string, string>;
	eventsTriggeringExpand: EventsTriggeringExpand;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	abbreviations: new Map<string, string>([
		['e.g.', 'for example'],
		['atm', 'at the moment'],
		['imo', 'in my opinion'],
		['cmpnt', 'component'],
		['w/', 'with'],
		['w/o', 'without'],
		['ily', 'I love you'],
		['srv', 'server'],
		['mvc', 'Model View Controller'],
		['k8s', 'Kubernetes']
	]),
	eventsTriggeringExpand: 'ON_SPACE',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
						this.plugin.settings.abbreviations.set('', '');
						await this.plugin.saveSettings();
					})
			)

		this.plugin.settings.abbreviations?.forEach((expansion, abbrevation) => {
			new Setting(containerEl)
				.addTextArea(textAreaAbbrev =>
					textAreaAbbrev
						.setPlaceholder('Abbrevation')
						.setValue(abbrevation)
						.onChange(async (value: string) => {
							this.plugin.settings.abbreviations.delete(abbrevation);
							this.plugin.settings.abbreviations.set(value, expansion);
							await this.plugin.saveSettings();
						}
					)
				)
				.addTextArea(textAreaExpansion =>
					textAreaExpansion
						.setPlaceholder('Meaning')
						.setValue(expansion)
						.onChange(async (value: string) => {
							this.plugin.settings.abbreviations.set(abbrevation, value);
							await this.plugin.saveSettings();
						}
					)
				)
				.addButton(removeButton =>
					removeButton
						.setIcon('cross')
						.onClick(async () => {
							this.plugin.settings.abbreviations.delete(abbrevation);
							await this.plugin.saveSettings();
						})
				)
				
		})
	}
}
