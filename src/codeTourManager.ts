import * as vscode from "vscode";

export class CodeTourManager {
  async startTour(): Promise<void> {
    const codeTourExtension = vscode.extensions.getExtension("vsls-contrib.codetour");
    if (!codeTourExtension) {
      vscode.window.showErrorMessage("CodeTour extension is not installed. Please install it.");
      return;
    }
    if (!codeTourExtension.isActive) {
      await codeTourExtension.activate();
    }
    try {
      await vscode.commands.executeCommand("codetour.startTour");
      vscode.window.showInformationMessage("Code Tour started successfully.");
    } catch (error: any) {
      vscode.window.showErrorMessage("Failed to start Code Tour: " + error.message);
    }
  }
}
