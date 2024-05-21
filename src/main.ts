import {
	Plugin, 
} from 'obsidian';

import {
	AbbreviationPluginSettings,
	DEFAULT_SETTINGS,
} from './types';

import { AbbreviationExpanderPlugin } from './abbreviation/AbbreviationExtention'
import Devlogger from './util/Devlogger';
import SettingsTab from './ui/SettingsTab';
import { ViewPlugin } from '@codemirror/view';


export default class AbbreviationPlugin extends Plugin {
	@Devlogger()
	private readonly logger: Console;

	settings: AbbreviationPluginSettings;

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerEditorExtension([
			ViewPlugin.define(
				(view) => new AbbreviationExpanderPlugin(view, this.settings)
			),
		])
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
