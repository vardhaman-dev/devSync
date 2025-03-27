import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import MarkdownIt from "markdown-it";

export class DocumentationPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  async show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        "ps8Docs",
        "PS8 Documentation",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
      this.panel.webview.html = await this.getWebviewContent();
    }
  }

  private async getWebviewContent(): Promise<string> {
    let markdownContent = "";
    // Search recursively for any .md file in the workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      // Use a recursive search pattern to catch all .md files in the workspace
      const files = await vscode.workspace.findFiles("**/*.md", "**/node_modules/**", 10);
      if (files.length === 1) {
        markdownContent = fs.readFileSync(files[0].fsPath, "utf8");
      } else if (files.length > 1) {
        // If multiple markdown files are found, prompt the user to select one.
        const fileNames = files.map(f => path.basename(f.fsPath));
        const selectedFile = await vscode.window.showQuickPick(fileNames, {
          placeHolder: "Select a markdown file to display as documentation"
        });
        if (selectedFile) {
          const selectedUri = files.find(f => path.basename(f.fsPath) === selectedFile);
          if (selectedUri) {
            markdownContent = fs.readFileSync(selectedUri.fsPath, "utf8");
          }
        }
      }
    }
    // If no markdown file is found, display a fallback message.
    if (!markdownContent) {
      markdownContent = `
# No Documentation Found

Please add a markdown (.md) file to the workspace to be displayed as documentation.
      `;
    }
    const md = new MarkdownIt();
    const htmlFromMd = md.render(markdownContent);
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>PS8 Documentation</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1, h2, h3 { color: #333; }
          pre { background-color: #f4f4f4; padding: 10px; }
        </style>
      </head>
      <body>
        ${htmlFromMd}
      </body>
      </html>
    `;
  }
}
