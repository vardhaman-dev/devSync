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

  // Command: Contextual Code Search
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

  // ✅ Command: AI Insights via Tabnine
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.aiInsights", async () => {
      try {
        const tabnineExt = vscode.extensions.getExtension("TabNine.tabnine-vscode");
        if (!tabnineExt) {
          vscode.window.showErrorMessage("❌ Tabnine extension is NOT installed.");
          return;
        }

        if (!tabnineExt.isActive) {
          await tabnineExt.activate();
        }

        // Wait for the extension to fully activate
        await new Promise(resolve => setTimeout(resolve, 1000));

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("❌ No active editor found.");
          return;
        }

        // Trigger AI-based code suggestions
        await vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");

        vscode.window.showInformationMessage("🔹 Tabnine AI Insights Activated!");
      } catch (error: any) {
        vscode.window.showErrorMessage(`❌ An error occurred: ${error.message}`);
      }
    })
  );

  // ✅ Auto-Prompting with Tabnine: Insert Prompt into Tabnine
  const autoPrompt = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const tabnineExt = vscode.extensions.getExtension("TabNine.tabnine-vscode");

    if (!tabnineExt || !tabnineExt.isActive) {
      vscode.window.showErrorMessage("❌ Tabnine is not installed or activated.");
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("❌ No active editor found.");
      return;
    }

    const fileName = document.fileName;
    const prompt = `/* 
      AUTO-GENERATED INSIGHTS REQUEST:  
      - What improvements can be made to ${path.basename(fileName)}?  
      - Identify any potential errors.  
      - Suggest additional features that could enhance functionality.  
    */\n\n`;

    // Insert the prompt at the beginning of the file (as a comment)
    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0, 0), prompt);
    });

    // Trigger AI Suggestions
    await vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");

    vscode.window.showInformationMessage(`💡 Tabnine is analyzing ${fileName} for insights!`);
  });

  context.subscriptions.push(autoPrompt);
}

export function deactivate() {}
