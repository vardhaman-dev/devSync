import * as path from "path";
import * as vscode from "vscode";
import { FileExplorerProvider } from "./treeViewProvider";
import { DocumentationPanel } from "./webviewPanel";
import { GitHubService } from "./githubService";
import { CodeTourManager } from "./codeTourManager";
import { DependencyVisualizer } from "./dependencyVisualizer";
import { CustomExplorerPanel } from "./customExplorer";
import { showContextualSearchResults } from "./contextualSearch";
import { activateAutoDocUpdater } from "./autoDocUpdater";

export function activate(context: vscode.ExtensionContext) {
  // Initialize services
  const docPanel = new DocumentationPanel(context);
  const githubService = new GitHubService();
  const codeTourManager = new CodeTourManager();
  const depVisualizer = new DependencyVisualizer(context);
  const customExplorer = new CustomExplorerPanel(context);
  const autoDocUpdater = activateAutoDocUpdater(context);

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    const treeProvider = new FileExplorerProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider("projectNavigator", treeProvider);
    context.subscriptions.push(
      vscode.commands.registerCommand("my-integrated-extension.refreshProjectNavigator", () => {
        treeProvider.refresh();
      })
    );
  } else {
    vscode.window.showErrorMessage("No workspace is open.");
  }

  // Command: Say Hello
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.helloWorld", () => {
      vscode.window.showInformationMessage("Hello from PS8!");
    })
  );

  // Command: Fetch GitHub Repository & Edit
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.fetchGitHubRepo", async () => {
      const repoInput = await vscode.window.showInputBox({
        prompt: "Enter GitHub repository (owner/repo)"
      });
      if (!repoInput) {
        vscode.window.showErrorMessage("Repository input is required.");
        return;
      }
      const parts = repoInput.split("/");
      if (parts.length !== 2) {
        vscode.window.showErrorMessage('Invalid format. Use "owner/repo".');
        return;
      }
      const [owner, repo] = parts;
      await githubService.fetchRepo(owner, repo);
      const cloneChoice = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: "Clone and open this repository for editing?"
      });
      if (cloneChoice === "Yes") {
        const folderUri = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          openLabel: "Select Folder to Clone Into"
        });
        if (folderUri && folderUri.length > 0) {
          await githubService.cloneRepo(owner, repo, folderUri[0].fsPath);
        }
      }
    })
  );

  // Command: Start Code Tour
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.startCodeTour", async () => {
      await codeTourManager.startTour();
    })
  );

  // Command: Open Documentation (Custom Webview)
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.openDocs", () => {
      docPanel.show();
    })
  );

  // Command: Map SRS to Code (Updated)
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.mapSRS", async () => {
      const workspaceRoot = vscode.workspace.rootPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace is open.");
        return;
      }
      const srsPath = vscode.Uri.file(path.join(workspaceRoot, "srs.md"));

      try {
        const srsContent = Buffer.from(await vscode.workspace.fs.readFile(srsPath)).toString("utf8");
        const srsLines = srsContent.split("\n");
        const srsRegex = /(SRS-\d{3,})/g;

        let srsMappings: { [id: string]: { files: string[]; locations: string[] } } = {};

        // Find SRS IDs in srs.md and track their locations
        srsLines.forEach((line, index) => {
          const matches = line.match(srsRegex);
          if (matches) {
            matches.forEach((id) => {
              if (!srsMappings[id]) {
                srsMappings[id] = { files: [], locations: [] };
              }
              srsMappings[id].locations.push(`📄 Found in srs.md (Line ${index + 1})`);
            });
          }
        });

        if (Object.keys(srsMappings).length === 0) {
          vscode.window.showInformationMessage("No SRS IDs found in the SRS file.");
          return;
        }

        // Search for SRS references in source files
        const codeFiles = await vscode.workspace.findFiles("src/**/*.{ts,tsx,js,jsx}", "**/node_modules/**");
        for (const file of codeFiles) {
          const fileContent = Buffer.from(await vscode.workspace.fs.readFile(file)).toString("utf8");
          const fileLines = fileContent.split("\n");

          fileLines.forEach((line, index) => {
            const matches = line.match(srsRegex);
            if (matches) {
              matches.forEach((id) => {
                if (srsMappings[id]) {
                  srsMappings[id].files.push(`${file.fsPath} (Line ${index + 1})`);
                }
              });
            }
          });
        }

        // Generate formatted output
        let mappingText = "";
        for (const id in srsMappings) {
          mappingText += `🔹 **${id}**\n`;
          mappingText += srsMappings[id].locations.join("\n") + "\n";
          mappingText += srsMappings[id].files.length > 0
            ? `📌 Found in:\n${srsMappings[id].files.map((f) => `   - ${f}`).join("\n")}\n`
            : "\n";
          mappingText += "\n";
        }

        // Display output in VS Code
        const outputChannel = vscode.window.createOutputChannel("SRS Mapping");
        outputChannel.show();
        outputChannel.appendLine(mappingText);
      } catch (err: any) {
        vscode.window.showErrorMessage("❌ Error reading SRS file: " + err.message);
      }
    })
  );


// Command: Open Tabnine Chat and Autofill Prompt
context.subscriptions.push(
	vscode.commands.registerCommand("my-integrated-extension.aiInsights", async () => {
	  try {
		const tabnineExtension = vscode.extensions.getExtension("TabNine.tabnine-vscode");
  
		if (!tabnineExtension) {
		  vscode.window.showErrorMessage("❌ Tabnine extension is NOT installed.");
		  return;
		}
  
		// Ensure Tabnine is activated
		if (!tabnineExtension.isActive) {
		  await tabnineExtension.activate();
		}
  
		// Open Tabnine Chat manually
		await vscode.commands.executeCommand("tabnine.chat.toggle");
  
		// Delay for UI to load before pasting prompt
		setTimeout(() => {
		  vscode.env.clipboard.writeText(
			"Analyze the current workspace and provide AI insights on improvements, potential errors, best practices, and optimizations. Highlight security risks, performance bottlenecks, and missing documentation."
		  );
		  vscode.commands.executeCommand("editor.action.clipboardPasteAction");
		}, 1000);
  
	  } catch (error: any) {
		vscode.window.showErrorMessage("❌ Failed to trigger Tabnine: " + error.message);
	  }
	})
  );
  
  
  

  // Command: Show Dependency Visualization
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.showDependencies", async () => {
      depVisualizer.show();
    })
  );

  // Command: Open Custom Explorer
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.openCustomExplorer", async () => {
      await customExplorer.show();
    })
  );

  // Command: Contextual Code Search (Semantic Search)
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.contextualSearch", async () => {
      await showContextualSearchResults();
    })
  );

  // Command: Update Documentation
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.updateDocs", async () => {
      await autoDocUpdater.updateDocumentation();
    })
  );
}

export function deactivate() {}
