import { Modal, App, Setting } from "obsidian";

export class ConfirmationModal extends Modal {
    private callback: () => void;

    constructor(app: App, callback: () => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Are you sure?" });
        contentEl.createEl("p", { text: "This will reset all your settings to default." });
        contentEl.createEl("p", { text: "Every changes you made so far will be undone" });
        

        new Setting(contentEl)
            .addButton((button) =>
                button
                    .setButtonText("Reset")
                    .setWarning()
                    .onClick(() => {
                        this.callback();
                        this.close();
                })
            )
    }

    onClose() {
        this.contentEl.empty();
    }
}