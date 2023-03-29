import { Setting } from "obsidian";

export type ExpansionEntrySettingParameters = {
	abbreviation: string;
	expansion: string;
	onSave?: () => never;
	onRemove?: () => never;
	onEdit?: () => never;
	onReset?: () => never;
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
					.setPlaceholder("abbreviation")
					.setValue(this.abbreviation)
					.onChange(opt.onEdit ?? emptyFunction)
			)
			// Expansion field
			.addText((textAreaExpansion) =>
				textAreaExpansion
					.setPlaceholder("Meaning")
					.setValue(this.expansion)
					.onChange(opt.onEdit ?? emptyFunction)
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
