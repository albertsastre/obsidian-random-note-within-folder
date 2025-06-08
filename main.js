const { Plugin, TFolder, TFile } = require("obsidian"); // Import the necessary classes from Obsidian

class RandomNoteWithinFolderPlugin extends Plugin { // Define the main plugin class extending Obsidian's Plugin class
	async onload() { // Load plugin

		function openRandomNoteWithinFolder(plugin, includeSubfolders = false) { // Common logic between both commands

			const activeFile = plugin.app.workspace.getActiveFile(); // Get the currently active file
			if (!activeFile) { // If no file is currently open
				plugin.app.commands.executeCommandById("random-note:open-random-note"); // Fallback: trigger the regular Random Note command
				return; // Exit to avoid errors if the Random Note plugin is disabled

			}

			const folder = plugin.app.vault.getAbstractFileByPath(activeFile.parent?.path); // Get the folder item from the active file's folder path
			if (!(folder instanceof TFolder)) return; // Exit to avoid errors if the item isn't a folder

			const notes = []; // Create the empty 'notes' array
			function selectNotes(folder) { // Create the 'selectNotes' function
				for (const item of folder.children) { // For each item in the folder
					if (item instanceof TFolder && includeSubfolders) { // If the item is a folder and 'includeSubfolders' = true
						selectNotes(item); // Run 'selectNotes' function
					} else if (item instanceof TFile && item.extension === "md" && item.path !== activeFile.path) { // Else if the item is a markdown file and not the active file
						notes.push(item); // Add the item to 'notes'
					}
				}
			}

			selectNotes(folder); // Run the 'selectNotes' function

			if (!notes.length) return; // Exit if there are no eligible notes

			const randomNote = notes[Math.floor(Math.random() * notes.length)]; // Select a random note
			plugin.app.workspace.openLinkText(randomNote.path, "/", false); // Open the selected note

		}

		this.addCommand({
			id: "open-random-note-within-folder",
			name: "",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }],
			callback: async () => openRandomNoteWithinFolder(this, false),
		});

		this.addCommand({
			id: "open-random-note-within-folder-include-subfolders",
			name: "Include subfolders",
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "r" }],
			callback: async () => openRandomNoteWithinFolder(this, true), // Run 'openRandomNoteWithinFolder' and set 'includeSubfolders' = true
		});
	}

}

module.exports = RandomNoteWithinFolderPlugin; // Export the plugin class for Obsidian to load