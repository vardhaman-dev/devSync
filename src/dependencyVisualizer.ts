import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface GraphNode {
  id: number;
  name: string;
  fullPath: string;
}

interface GraphLink {
  source: number;
  target: number;
}

export class DependencyVisualizer {
  constructor(private context: vscode.ExtensionContext) {}

  show(): void {
    const workspaceRoot = vscode.workspace.rootPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage("No workspace folder is open.");
      return;
    }

    // Build the folder graph data from the workspace root.
    const graphData = this.buildFolderGraph(workspaceRoot);
    const dataString = JSON.stringify(graphData);

    const panel = vscode.window.createWebviewPanel(
      "dependencyViz",
      "Dependency Visualization",
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );
    panel.webview.html = this.getWebviewContent(dataString);
  }

  /**
   * Recursively traverse the folder structure starting from root,
   * building nodes and links for the graph.
   */
  private buildFolderGraph(root: string): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    let idCounter = 0;

    function traverse(currentPath: string, parentId: number | null): number {
      const name = path.basename(currentPath);
      const id = idCounter++;
      const node: GraphNode = { id, name, fullPath: currentPath };
      nodes.push(node);
      if (parentId !== null) {
        links.push({ source: parentId, target: id });
      }
      try {
        const stat = fs.statSync(currentPath);
        if (stat.isDirectory()) {
          const items = fs.readdirSync(currentPath);
          for (const item of items) {
            const itemPath = path.join(currentPath, item);
            traverse(itemPath, id);
          }
        }
      } catch (err) {
        // Ignore permission errors or other issues.
      }
      return id;
    }

    traverse(root, null);
    return { nodes, links };
  }

  private getWebviewContent(dataString: string): string {
    // The webview content loads D3.js from CDN and draws a force-directed graph using the provided data.
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Dependency Visualization</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          svg { width: 100%; height: 600px; border: 1px solid #ccc; }
          .node text { pointer-events: none; font-size: 10px; fill: #333; }
          .node circle { stroke: #fff; stroke-width: 1.5px; }
          .link { stroke: #999; stroke-opacity: 0.6; }
        </style>
      </head>
      <body>
        <h1>Workspace Folder Structure</h1>
        <svg id="graph"></svg>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <script>
          const graphData = ${dataString};

          const svg = d3.select("#graph"),
                width = +svg.node().getBoundingClientRect().width,
                height = +svg.node().getBoundingClientRect().height;

          const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

          const link = svg.append("g")
              .attr("class", "links")
            .selectAll("line")
            .data(graphData.links)
            .join("line")
              .attr("class", "link")
              .attr("stroke-width", 1.5);

          const node = svg.append("g")
              .attr("class", "nodes")
            .selectAll("g")
            .data(graphData.nodes)
            .join("g")
              .call(drag(simulation));

          node.append("circle")
              .attr("r", 8)
              .attr("fill", d => d3.schemeCategory10[d.id % 10]);

          node.append("text")
              .attr("dx", 10)
              .attr("dy", 3)
              .text(d => d.name);

          simulation.on("tick", () => {
            link
              .attr("x1", d => d.source.x)
              .attr("y1", d => d.source.y)
              .attr("x2", d => d.target.x)
              .attr("y2", d => d.target.y);

            node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
          });

          function drag(simulation) {
            function dragstarted(event, d) {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            }
            function dragged(event, d) {
              d.fx = event.x;
              d.fy = event.y;
            }
            function dragended(event, d) {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }
            return d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended);
          }
        </script>
      </body>
      </html>
    `;
  }
}
