import { Setting } from "obsidian";
import { debounce } from 'lodash';


export type ExpansionEntrySettingParameters = {
	abbreviation: string;
	expansion: string;
	onRemove?: () => unknown;
	onAbbreviationEdit?: (value: string, oldValue: string) => unknown;
	onExpansionEdit?: (value: string, oldValue: string) => unknown;
};

export class ExpansionEntrySetting extends Setting {
	abbreviation: string;
	expansion: string;

	constructor(elt: HTMLElement, opt: ExpansionEntrySettingParameters) {
		super(elt);
		this.abbreviation = opt.abbreviation;
		this.expansion = opt.expansion;

		const emptyFunction = (...args: never) => {};

		this.addText((textAreaAbbrev) =>
				textAreaAbbrev
					.setPlaceholder("Abbreviation")
					.setValue(this.abbreviation)
					.onChange(
						debounce((value: string) => (opt.onAbbreviationEdit)? 
							opt.onAbbreviationEdit(value, this.abbreviation) : 
							emptyFunction
						, 750)
					)
			)
			// Expansion field
			.addText((textAreaExpansion) =>
				textAreaExpansion
					.setPlaceholder("Meaning")
					.setValue(this.expansion)
					.onChange(
						debounce((value: string) => (opt.onExpansionEdit)?
							opt.onExpansionEdit(value, this.expansion) :
							emptyFunction
						, 750)
					)
			)
			// Remove button
			.addExtraButton((removeButton) =>
				removeButton
					.setIcon("cross")
					.setTooltip("Remove")
					.onClick(opt.onRemove ?? emptyFunction)
			);
	}

	public get getAbbreviation(): string {
		return this.abbreviation;
	}

	public get getExpansion(): string {
		return this.expansion;
	}
}
