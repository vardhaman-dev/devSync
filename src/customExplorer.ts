import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ExplorerNode {
  name: string;
  fullPath: string;
  children?: ExplorerNode[];
  isDirectory: boolean;
}

export class CustomExplorerPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  public async show() {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "customExplorer",
        "Custom Project Explorer",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(this.context.extensionPath)]
        }
      );
      // Handle messages from the webview to open files
      this.panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === "openFile") {
            const filePath = message.text;
            vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filePath));
          }
        },
        undefined,
        this.context.subscriptions
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const treeData = this.buildExplorerTree(rootPath);
    const htmlContent = this.getHtmlForWebview(treeData);
    this.panel.webview.html = htmlContent;
    this.panel.reveal(vscode.ViewColumn.One);
  }

  // Recursively build the explorer tree from the given root folder
  private buildExplorerTree(root: string): ExplorerNode {
    const stats = fs.statSync(root);
    const node: ExplorerNode = {
      name: path.basename(root),
      fullPath: root,
      isDirectory: stats.isDirectory()
    };
    if (node.isDirectory) {
      try {
        const items = fs.readdirSync(root);
        node.children = items.map(item => this.buildExplorerTree(path.join(root, item)));
      } catch (e) {
        node.children = [];
      }
    }
    return node;
  }

  // Generate the HTML for the custom explorer webview
  private getHtmlForWebview(treeData: ExplorerNode): string {
    const style = `
      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f9;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        header {
          background-color: #007acc;
          color: #fff;
          padding: 16px;
          font-size: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        #container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        ul {
          list-style-type: none;
          padding-left: 20px;
          margin: 0;
        }
        li {
          margin: 4px 0;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 4px;
          transition: background-color 0.2s ease-in-out;
        }
        li:hover {
          background-color: #e0f0ff;
        }
        .folder::before {
          content: "📁 ";
          font-size: 16px;
        }
        .file::before {
          content: "📄 ";
          font-size: 16px;
        }
        .collapsed > ul {
          display: none;
        }
        .node-label {
          font-size: 14px;
        }
      </style>
    `;

    const script = `
      <script>
        const vscode = acquireVsCodeApi();
        document.addEventListener('DOMContentLoaded', function () {
          // Attach click listeners for folder toggle
          document.querySelectorAll('.folder').forEach(function(el) {
            el.addEventListener('click', function(event) {
              event.stopPropagation();
              el.parentElement.classList.toggle('collapsed');
            });
          });
          // Attach click listeners for file opening
          document.querySelectorAll('.file').forEach(function(el) {
            el.addEventListener('click', function(event) {
              event.stopPropagation();
              const filePath = el.getAttribute('data-path');
              if (filePath) {
                vscode.postMessage({ command: 'openFile', text: filePath });
              }
            });
          });
        });
      </script>
    `;

    // Recursive function to generate the HTML list
    function generateList(node: ExplorerNode): string {
      const iconClass = node.isDirectory ? "folder" : "file";
      const dataAttr = node.isDirectory ? "" : ` data-path="${node.fullPath}"`;
      let html = `<li class="${iconClass}"${dataAttr}><span class="node-label">${node.name}</span>`;
      if (node.children && node.children.length > 0) {
        html += "<ul>";
        for (const child of node.children) {
          html += generateList(child);
        }
        html += "</ul>";
      }
      html += "</li>";
      return html;
    }

    const treeHtml = `<ul>${generateList(treeData)}</ul>`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Custom Project Explorer</title>
        ${style}
      </head>
      <body>
        <header>Custom Project Explorer</header>
        <div id="container">
          ${treeHtml}
        </div>
        ${script}
      </body>
      </html>
    `;
  }
}
