import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import MarkdownIt from "markdown-it";

export class DocumentationPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      "ps8Docs",
      "PS8 Documentation",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    this.panel.webview.html = this.getWebviewContent();
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private getWebviewContent(): string {
    // First, try to read DOCUMENTATION.md from the workspace folder.
    let markdownContent = "";
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const docPath = path.join(workspaceFolders[0].uri.fsPath, "DOCUMENTATION.md");
      if (fs.existsSync(docPath)) {
        markdownContent = fs.readFileSync(docPath, "utf8");
      }
    }
    // If not found, fallback to default documentation from extension folder.
    if (!markdownContent) {
      const defaultDocPath = path.join(this.context.extensionPath, "DOCUMENTATION.md");
      if (fs.existsSync(defaultDocPath)) {
        markdownContent = fs.readFileSync(defaultDocPath, "utf8");
      } else {
        markdownContent = `
# PS8 Documentation

Welcome to the **PS8 Project Development & Assistance Platform**.

## Key Features

- **SRS-to-Code Mapping:** Automatically links SRS requirements with code.
- **Intelligent Navigation:** Explore your project via a custom file explorer.
- **Guided Onboarding:** Start guided tours with CodeTour.
- **AI-powered Insights:** Trigger AI insights via your cline extension.
- **Dependency Visualization:** Graphically view module dependencies.
        `;
      }
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
