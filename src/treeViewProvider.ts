import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class FileExplorerProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FileItem): Promise<FileItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No workspace folder found");
      return [];
    }
    const dirPath = element ? element.resourceUri.fsPath : this.workspaceRoot;
    return this.getFilesInDirectory(dirPath);
  }

  private getFilesInDirectory(dir: string): FileItem[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    const files = fs.readdirSync(dir);
    return files.map(fileName => {
      const filePath = path.join(dir, fileName);
      const stats = fs.statSync(filePath);
      const fileItem = new FileItem(
        vscode.Uri.file(filePath),
        stats.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
      );
      fileItem.contextValue = stats.isDirectory() ? "folder" : "file";
      return fileItem;
    });
  }
}

export class FileItem extends vscode.TreeItem {
  constructor(
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(resourceUri, collapsibleState);
    this.tooltip = this.resourceUri.fsPath;
    this.description = this.resourceUri.fsPath;
  }
}
