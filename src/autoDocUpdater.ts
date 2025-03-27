import * as vscode from "vscode";
import * as path from "path";
import { exec } from "child_process";
import * as fs from "fs";

export class AutoDocUpdater {
  private outputChannel: vscode.OutputChannel;
  private docFile: string;
  private workspaceRoot: string;
  public static commandRegistered = false; // 🔥 FIXED: Made it public

  constructor(context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Auto Documentation");
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    this.docFile = path.join(this.workspaceRoot, "DOCUMENTATION.md");

    this.startMonitoring(context);
  }

  private startMonitoring(context: vscode.ExtensionContext) {
    if (!AutoDocUpdater.commandRegistered) {  // ✅ No more error!
      context.subscriptions.push(
        vscode.commands.registerCommand("my-integrated-extension.updateDocs", async () => {
          await this.updateDocumentation();
        })
      );
      AutoDocUpdater.commandRegistered = true;
    }
  }

  private async getGitChanges(): Promise<{ type: string; file: string; message: string }[]> {
    return new Promise((resolve, reject) => {
      exec("git log --name-status --pretty=format:'%H %s' -n 10", { cwd: this.workspaceRoot }, (err, stdout) => {
        if (err) {
          vscode.window.showErrorMessage("❌ Failed to retrieve Git history. Ensure your project is a Git repository.");
          return reject(err);
        }

        const lines = stdout.split("\n");
        let changes: { type: string; file: string; message: string }[] = [];
        let currentMessage = "";

        for (let line of lines) {
          if (line.startsWith("'")) {
            const [commitHash, ...messageParts] = line.replace(/'/g, "").split(" ");
            currentMessage = messageParts.join(" ");
          } else if (line.match(/^[A-Z]\t/)) {
            const [status, filePath] = line.split("\t");
            let type = "";

            if (status === "M") type = "Modified";
            else if (status === "A") type = "Added";
            else if (status === "D") type = "Deleted";

            if (type) {
              changes.push({ type, file: filePath.trim(), message: currentMessage });
            }
          }
        }

        resolve(changes);
      });
    });
  }

  public async updateDocumentation() {
    try {
      const changes = await this.getGitChanges();
      if (changes.length === 0) {
        vscode.window.showInformationMessage("No recent changes found in Git history.");
        return;
      }

      let existingContent = "";
      try {
        existingContent = fs.readFileSync(this.docFile, "utf8");
      } catch {
        this.outputChannel.appendLine("No existing documentation file found. Creating a new one.");
      }

      let newDocContent = `# 📖 Project Documentation\n\n`;
      newDocContent += `_Last Updated: ${new Date().toLocaleString()}_\n\n`;
      newDocContent += `---\n\n## 📌 **Project Overview**\n`;
      newDocContent += `This project is a VS Code extension that automates project understanding by mapping SRS to code, providing guided onboarding, and offering interactive documentation.\n\n`;
      newDocContent += `---\n\n## 🔄 **Recent Updates**\n`;
      newDocContent += `### 🕒 Updated on: ${new Date().toLocaleString()}\n\n`;

      if (changes.length > 0) {
        newDocContent += `| Type       | File Path                | Commit Message |\n`;
        newDocContent += `|-----------|--------------------------|----------------|\n`;
        changes.forEach((change) => {
          newDocContent += `| ${change.type} | \`${change.file}\` | ${change.message} |\n`;
        });
        newDocContent += `\n`;
      }

      newDocContent += `---\n`;

      fs.writeFileSync(this.docFile, newDocContent, "utf8");

      this.outputChannel.appendLine("✅ Documentation updated successfully.");
      vscode.window.showInformationMessage("📄 Documentation updated using Git history!");
    } catch (err: any) {
      vscode.window.showErrorMessage("❌ Error updating documentation: " + err.message);
    }
  }
}

/**
 * Activates the auto-documentation feature and starts real-time monitoring.
 */
export function activateAutoDocUpdater(context: vscode.ExtensionContext): AutoDocUpdater {
  if (!AutoDocUpdater.commandRegistered) {
    AutoDocUpdater.commandRegistered = true;
    return new AutoDocUpdater(context);
  } else {
    console.log("🚀 AutoDocUpdater is already activated.");
    return null as any;
  }
}
    