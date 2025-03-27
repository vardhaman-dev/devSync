import * as vscode from "vscode";
import * as path from "path";
import Fuse from "fuse.js";

interface FileIndex {
  file: string;
  fileName: string;
  content: string;
}

export interface SearchResult {
  file: string;
  fileName: string;
  snippet: string;
  score: number;
}

/**
 * Build an index of files in the workspace.
 * This searches for common text-based files (js, ts, jsx, tsx, md, txt)
 * and indexes the file name and the first 1000 characters of their content.
 */
async function buildFileIndex(): Promise<FileIndex[]> {
  const fileIndexes: FileIndex[] = [];
  // Adjust the glob pattern as needed
  const files = await vscode.workspace.findFiles("**/*.{js,ts,jsx,tsx,md,txt}", "**/node_modules/**", 300);
  
  for (const file of files) {
    try {
      const contentBuffer = await vscode.workspace.fs.readFile(file);
      const content = Buffer.from(contentBuffer).toString("utf8");
      if (content.trim().length < 10) continue;
      // Use first 1000 characters for a larger snippet
      const snippet = content.substring(0, 1000);
      fileIndexes.push({
        file: file.fsPath,
        fileName: path.basename(file.fsPath),
        content: snippet,
      });
    } catch (err) {
      console.error("Error reading file:", file.fsPath, err);
    }
  }
  return fileIndexes;
}

/**
 * Performs contextual search using Fuse.js.
 * Uses weighted keys to search by file name and content.
 * With a high threshold (0.95) and ignoreLocation: true, it is more lenient.
 */
export async function performContextualSearch(query: string): Promise<SearchResult[]> {
  const fileIndexes = await buildFileIndex();
  
  const fuseOptions: Fuse.IFuseOptions<FileIndex> = {
    keys: [
      { name: "fileName", weight: 0.5 },
      { name: "content", weight: 0.5 }
    ],
    threshold: 0.95,  // Very lenient
    includeScore: true,
    ignoreLocation: true,
  };

  const fuse = new Fuse(fileIndexes, fuseOptions);
  const fuseResults = fuse.search(query);
  
  // Map Fuse results into our SearchResult interface.
  const results: SearchResult[] = fuseResults.map(res => {
    // Fuse score: lower is better; invert it so that higher means better match.
    const score = res.score !== undefined ? 1 - res.score : 1;
    return {
      file: res.item.file,
      fileName: res.item.fileName,
      snippet: res.item.content.substring(0, 80) + (res.item.content.length > 80 ? "..." : ""),
      score: score,
    };
  });

  // Sort results by descending score (best matches first)
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Prompts the user for a search query, performs the contextual search,
 * and displays the results in a QuickPick list.
 */
export async function showContextualSearchResults() {
  const query = await vscode.window.showInputBox({ prompt: "Enter your search query (e.g. 'index file')" });
  if (!query) {
    vscode.window.showErrorMessage("Search query is required.");
    return;
  }
  
  const results = await performContextualSearch(query);
  if (results.length === 0) {
    vscode.window.showInformationMessage("No results found for query: " + query);
    return;
  }
  
  const items: vscode.QuickPickItem[] = results.map(result => ({
    label: result.fileName,
    description: result.snippet,
    detail: result.file + " (Score: " + result.score.toFixed(3) + ")"
  }));
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a file to open",
    matchOnDescription: true,
    matchOnDetail: true,
  });
  
  if (selected && selected.detail) {
    // Extract file path from detail assuming format "filepath (Score: ...)"
    const filePath = selected.detail.split(" (Score:")[0];
    vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filePath));
  }
}
