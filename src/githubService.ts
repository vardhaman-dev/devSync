import * as vscode from "vscode";
import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import * as path from "path";

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit();
  }

  async fetchRepo(owner: string, repo: string): Promise<void> {
    try {
      vscode.window.showInformationMessage(`Fetching repository ${owner}/${repo}...`);
      const { data } = await this.octokit.repos.get({ owner, repo });
      vscode.window.showInformationMessage(`Fetched repository: ${data.full_name}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error fetching repository: ${error.message}`);
    }
  }

  async cloneRepo(owner: string, repo: string, targetDir: string): Promise<void> {
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    const clonePath = path.join(targetDir, repo);
    const terminal = vscode.window.createTerminal(`Clone Repo`);
    terminal.sendText(`git clone ${repoUrl} "${clonePath}"`);
    terminal.show();
    // Optionally, wait a few seconds then open the folder in a new window
    setTimeout(() => {
      vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(clonePath), true);
    }, 5000);
  }
}
