import * as path from "path";
import * as vscode from "vscode";
import { FileExplorerProvider } from "./treeViewProvider";
import { DocumentationPanel } from "./webviewPanel";
import { GitHubService } from "./githubService";
import { CodeTourManager } from "./codeTourManager";
import { DependencyVisualizer } from "./dependencyVisualizer";

export function activate(context: vscode.ExtensionContext) {
  // Initialize services
  const docPanel = new DocumentationPanel(context);
  const githubService = new GitHubService();
  const codeTourManager = new CodeTourManager();
  const depVisualizer = new DependencyVisualizer(context);

  // Register the Project Navigator tree view
  const workspaceRoot = vscode.workspace.rootPath;
  if (workspaceRoot) {
    const treeProvider = new FileExplorerProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider("projectNavigator", treeProvider);
    context.subscriptions.push(
      vscode.commands.registerCommand("my-integrated-extension.refreshProjectNavigator", () => {
        treeProvider.refresh();
      })
    );
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
      // First, fetch the repository details.
      await githubService.fetchRepo(owner, repo);
      // Then, ask if user wants to clone & open the repo.
      const cloneChoice = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: "Do you want to clone and open this repository for editing?"
      });
      if (cloneChoice === "Yes") {
        // Ask for target directory to clone into
        const folderUri = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          openLabel: "Select Folder to Clone Repository Into"
        });
        if (!folderUri || folderUri.length === 0) {
          vscode.window.showErrorMessage("No folder selected.");
          return;
        }
        await githubService.cloneRepo(owner, repo, folderUri[0].fsPath);
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

  // Command: Map SRS to Code
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.mapSRS", async () => {
      const workspaceRoot = vscode.workspace.rootPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace is open.");
        return;
      }
      const srsPath = vscode.Uri.file(path.join(workspaceRoot, "srs.md"));
      try {
        const srsContent = await vscode.workspace.fs.readFile(srsPath);
        const contentStr = Buffer.from(srsContent).toString("utf8");
        const srsRegex = /(SRS-\d{3,})/g;
        const matches = contentStr.match(srsRegex);
        if (!matches) {
          vscode.window.showInformationMessage("No SRS IDs found in the SRS file.");
          return;
        }
        const srsIDs = Array.from(new Set(matches));
        const mapping: { [id: string]: string[] } = {};
        for (const id of srsIDs) {
          mapping[id] = [];
          const files = await vscode.workspace.findFiles("src/**/*.{ts,tsx,js,jsx}", "**/node_modules/**");
          for (const file of files) {
            const fileContent = Buffer.from(await vscode.workspace.fs.readFile(file)).toString("utf8");
            if (fileContent.includes(id)) {
              mapping[id].push(file.fsPath);
            }
          }
        }
        let mappingText = "";
        for (const id of Object.keys(mapping)) {
          mappingText += `${id} found in:\n${mapping[id].map(f => `  ${f}`).join("\n")}\n\n`;
        }
        if (!mappingText) {
          mappingText = "No mappings found.";
        }
        const outputChannel = vscode.window.createOutputChannel("SRS Mapping");
        outputChannel.show();
        outputChannel.appendLine(mappingText);
      } catch (err: any) {
        vscode.window.showErrorMessage("Error reading SRS file: " + err.message);
      }
    })
  );

  // Command: AI-powered Insights using cline extension
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.aiInsights", async () => {
      const aiExtension = vscode.extensions.getExtension("saoudrizwan.claude-dev");
      if (!aiExtension) {
        vscode.window.showErrorMessage("AI Insights extension (cline) is not installed.");
        return;
      }
      if (!aiExtension.isActive) {
        await aiExtension.activate();
      }
      try {
        // Assumes the cline extension exposes a command "saoudrizwan.claude-dev.run"
        await vscode.commands.executeCommand("saoudrizwan.claude-dev.run");
      } catch (error: any) {
        vscode.window.showErrorMessage("Failed to trigger AI Insights: " + error.message);
      }
    })
  );

  // Command: Show Dependency Visualization
  context.subscriptions.push(
    vscode.commands.registerCommand("my-integrated-extension.showDependencies", async () => {
      depVisualizer.show();
    })
  );
}

export function deactivate() {}
