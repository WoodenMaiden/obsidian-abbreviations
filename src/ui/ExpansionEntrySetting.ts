import { Setting, debounce} from "obsidian";

import { Expansion } from "../types";

export type ExpansionEntrySettingParameters = {
	abbreviation: string;
	expansion: Expansion;
	onDisable?: (value: boolean) => unknown;
	onRemove?: () => unknown;
	onAbbreviationEdit?: (value: string, oldValue: string) => unknown;
	onExpansionEdit?: (value: string, oldValue: string) => unknown;
	onCaseSensitiveChange?: () => unknown;
};

export class ExpansionEntrySetting extends Setting {
	abbreviation: string;
	expansion: Expansion;

	constructor(elt: HTMLElement, opt: ExpansionEntrySettingParameters) {
		super(elt);
		elt.addClass("center-h");
		this.abbreviation = opt.abbreviation;
		this.expansion = opt.expansion;

		const emptyFunction = (..._: never) => {};
		this.addToggle((toggle) =>
			toggle
				.setValue(this.expansion.isEnabled)
				.onChange(opt.onDisable ?? emptyFunction)
			)
			.addText((textAreaAbbrev) =>
				textAreaAbbrev
					.setPlaceholder("Abbreviation")
					.setValue(this.abbreviation)
					.onChange(
						debounce((value: string) => (opt.onAbbreviationEdit)? 
							opt.onAbbreviationEdit(value, this.abbreviation) : 
							emptyFunction
						, 750, true)
					)
					.setDisabled(!this.expansion.isEnabled)
			)
			// Expansion field
			.addText((textAreaExpansion) =>
				textAreaExpansion
					.setPlaceholder("Meaning")
					.setValue(this.expansion.value)
					.onChange(
						debounce((value: string) => (opt.onExpansionEdit)?
							opt.onExpansionEdit(value, this.expansion.value) :
							emptyFunction
						, 750)
					)
					.setDisabled(!this.expansion.isEnabled)
			)
			// case sensitive button
			.addButton(caseButton => {
				caseButton
					.setIcon("case-sensitive")
					.setTooltip("Case sensitive")
					.onClick(opt.onCaseSensitiveChange ?? emptyFunction)

				if (this.expansion.isCaseSensitive) caseButton.setClass("turned-on") 
			})
			// Remove button
			.addExtraButton(removeButton =>
				removeButton
					.setIcon("cross")
					.setTooltip("Remove")
					.onClick(opt.onRemove ?? emptyFunction)
			)
	}

	public get getAbbreviation(): string {
		return this.abbreviation;
	}

	public get getExpansion(): Expansion {
		return this.expansion;
	}
}
