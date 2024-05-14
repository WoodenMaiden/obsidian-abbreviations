import {
	App,  
	PluginSettingTab, 
	Setting,
	Notice
} from 'obsidian';

import { ExpansionEntrySetting } from '../ui/ExpansionEntrySetting';
import { ConfirmationModal } from '../ui/ConfirmationModal';

import AbbreviationPlugin from '../main';

import { Expansion } from '../types';

export default class AbbreviationSettingTab extends PluginSettingTab {
	plugin: AbbreviationPlugin;

	constructor(app: App, plugin: AbbreviationPlugin) {
		super(app, plugin);
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

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

		containerEl.createEl('p', { text: 'Here you can define your abbreviations.'});
		const listingFeatEl = containerEl.createEl('ul');
		listingFeatEl.createEl('li', { text: 'The toggle button at the left of each entry allows you to enable/disable the abbreviation.'});
		listingFeatEl.createEl('li', { text: 'The first text field at the center is the abbreviation itself.'});
		listingFeatEl.createEl('li', { text: 'The second text field is its meaning, which will appear on your documents.'});
		listingFeatEl.createEl('li', { text: 'The button at the right of each entry allows you to set if your abbreviation is case sentitive.'});
		listingFeatEl.createEl('li', { text: 'The last button at the far right of an entry allows you to remove it.'});
		
		// Here goes all the abbreviations entries
		const listEl = containerEl.createEl("ul");
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
					},
					onCaseSensitiveChange: async () =>{
						this.plugin.settings.abbreviations[abbreviation].isCaseSensitive =
							!this.plugin.settings.abbreviations[abbreviation].isCaseSensitive;

						await this.plugin.saveSettings()
						this.display();
					},
				})
			})
	}
}
