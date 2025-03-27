import * as vscode from "vscode";
import { Octokit } from "@octokit/rest";

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
}
