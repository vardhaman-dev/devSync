import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import MarkdownIt from "markdown-it";

export class DocumentationPanel {
  private panel: vscode.WebviewPanel | undefined;
  private mdWatcher: vscode.FileSystemWatcher | undefined;
  private currentDocPath: string | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  async show() {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "ps8Docs",
        "PS8 Documentation",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
        if (this.mdWatcher) {
          this.mdWatcher.dispose();
          this.mdWatcher = undefined;
        }
      });
      // Watch for markdown changes in the workspace
      this.startWatcher();
    }
    // Update content on show
    this.panel.webview.html = await this.getWebviewContent();
    this.panel.reveal(vscode.ViewColumn.One);
  }

  private startWatcher() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }
    // Watch any markdown file changes in the workspace
    const pattern = new vscode.RelativePattern(workspaceFolders[0], "**/*.md");
    this.mdWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    this.mdWatcher.onDidChange(() => this.refreshContent());
    this.mdWatcher.onDidCreate(() => this.refreshContent());
    this.mdWatcher.onDidDelete(() => this.refreshContent());
  }

  private async refreshContent() {
    if (this.panel) {
      this.panel.webview.html = await this.getWebviewContent();
    }
  }

  private async getWebviewContent(): Promise<string> {
    let markdownContent = "";
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      // Try to find a markdown file. If multiple, pick the first one.
      const files = await vscode.workspace.findFiles("**/*.md", "**/node_modules/**", 1);
      if (files.length > 0) {
        this.currentDocPath = files[0].fsPath;
        markdownContent = fs.readFileSync(this.currentDocPath, "utf8");
      }
    }
    if (!markdownContent) {
      markdownContent = `
# No Documentation Found

Please add a markdown (.md) file to the workspace.
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
