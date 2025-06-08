const { Plugin, PluginSettingTab, Setting, TFolder, TFile, Notice } = require("obsidian"); // Import necessary classes from Obsidian for plugin development

const DEFAULT_SETTINGS = { // Define default settings for the plugin
	expandToSubfolders: false // Default setting
};

class RandomNoteWithinFolderPlugin extends Plugin { // Define the main plugin class extending Obsidian's Plugin class
	async onload() { // Method called when the plugin is loaded
		// Fallback to the random note plugin assumes it is available; no check is performed.
		await this.loadSettings(); // Load saved settings or use defaults
		this.addSettingTab(new RandomNoteWithinFolderSettingTab(this.app, this)); // Add a settings tab to Obsidian's settings UI

		this.addCommand({ // Register a new command in Obsidian
			id: "open-random-note-within-folder", // Unique ID for the command
			name: "Open a random Note within the current folder", // Display name for the command
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }], // Define hotkey
			callback: async () => { // Function to execute when command is triggered
				const activeFile = this.app.workspace.getActiveFile(); // Get the currently active file in the workspace to determine the folder context
				if (!activeFile) { // If no file is currently open in the editor
					this.app.commands.executeCommandById("random-note:open-random-note"); // Fallback: trigger the random note command from the core Random Note plugin
					return; // Stop further execution to avoid null errors if the core Random Note plugin is disabled.
				}

				let folderPath = activeFile.parent?.path; // Get the path of the folder containing the active file
				if (this.settings.expandToSubfolders && this.lastUsedFolderPath) { // If setting enabled and last used folder path exists
					folderPath = this.lastUsedFolderPath; // Use the last used folder path instead
				}

				const folder = this.app.vault.getAbstractFileByPath(folderPath); // Get the folder object from the vault by path
				if (!(folder instanceof TFolder)) return; // Exit if the path is not a folder to prevent errors

				let files = []; // Initialize an array to hold eligible files
				ObsidianUtils.iterateFiles(folder, (file) => { // Recursively iterate over files in the folder
					if (file instanceof TFile && file.extension === "md" && file.path !== activeFile.path) { // Check if file is a markdown file and not the active file
						files.push(file); // Add file to the list
					}
				});

				if (!files.length) return; // Exit early if no eligible files found to avoid errors

				const randomFile = files[Math.floor(Math.random() * files.length)]; // Select a random file from the list
				this.lastUsedFolderPath = randomFile.parent?.path; // Store the folder path of the randomly selected file for next time
				await this.app.workspace.openLinkText(randomFile.path, "/", false); // Open the randomly selected file in the workspace editor
			},
		});
	}

	async loadSettings() { // Method to load plugin settings from disk
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); // Merge saved data with default settings
	}

	async saveSettings() { // Method to save plugin settings to disk
		await this.saveData(this.settings); // Save current settings
	}
}

class RandomNoteWithinFolderSettingTab extends PluginSettingTab { // Define a class for the settings tab UI
	constructor(app, plugin) { // Constructor receives the app instance and the plugin instance
		super(app, plugin); // Initialize the base class with required parameters
		this.plugin = plugin; // Store reference to the plugin instance
	}

	display() { // Method to render the settings tab UI
		const { containerEl } = this; // Get the container element for the settings tab
		containerEl.empty(); // Clear any existing content in the container

		containerEl.createEl("h2", { text: "Random Note Within Folder Settings" }); // Create a heading element for the settings tab

		new Setting(containerEl) // Create a new setting UI element inside the container
			.setName("Include subfolders") // Setting name
			.setDesc("Include notes in subfolders. Keep in mind that if the random note chosen is in a subfolder, the next random note will be restricted to that folder") // Setting description
			.addToggle(toggle => // Add a toggle switch to enable/disable the setting
				toggle
					.setValue(this.plugin.settings.expandToSubfolders) // Initialize toggle with current setting value
					.onChange(async (value) => { // Define what happens when the toggle value changes
						this.plugin.settings.expandToSubfolders = value; // Update the plugin setting
						await this.plugin.saveSettings(); // Save the updated settings
					}));
	}
}

const ObsidianUtils = { // Define a utility object for common operations
	iterateFiles(folder, callback) { // Method to recursively iterate over all files in a folder and its subfolders
		for (const item of folder.children) { // Loop through each item in the folder
			if (item instanceof TFolder) { // If the item is a folder
				ObsidianUtils.iterateFiles(item, callback); // Recursively iterate files in the subfolder
			} else { // Otherwise, the item is a file
				callback(item); // Execute the callback function on the file
			}
		}
	}
};

module.exports = RandomNoteWithinFolderPlugin; // Export the main plugin class as the module's default export for Obsidian to load the plugin