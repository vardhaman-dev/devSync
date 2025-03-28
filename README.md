# 🚀 RETROTHON-020
# 📌 Project Name: DevSync Extension (PS8: Project Development and Assistance Platform)

## 🎭 1. Team Name
## Team Illusion

## 👥 2. Team Members
| 🏷 Name | 📞 Contact Number | 📧 Email |
|------|---------------|-------|
| Vrashab Timmannavar | 📱 9422642149 | 📩 vrashab.dev@gmail.com |
| Vardhaman Ganpule | 📱 91684 36525 | 📩 vardhaman.ganpule@gmail.com |
| Ishan Parab | 📱 74990 14563 | 📩 ishanparab@yahoo.com |

## 🔍 Overview

DevSync is a 🛠 Visual Studio Code extension designed to automate project understanding by mapping 📜 Software Requirement Specifications (SRS) to code, providing 📖 interactive documentation, and assisting developers with 🏗 guided onboarding. This extension enhances the development experience by offering 🧭 intelligent project navigation, 🤖 AI-powered search, and 🔄 real-time documentation updates.

## 👤 3. Individual Contributions
- **Vrashab Timmannavar**: 🤖 AI Integration and 📜 Interactive Documentation Generation
- **Vardhaman Ganpule**: 🔗 GitHub Integration, 🗺 SRS-to-Code Mapping, 👨‍🏫 Guided Onboarding for Developers
- **Ishan Parab**: 🔍 Dependency & 🎨 Architecture Visualization

## 📂 4. File/Folder Structure
```
ps8-extension/
├── .vscode/                     # ⚙️ VS Code specific settings
├── src/                         # 📦 Source files
│   ├── autoDocUpdater.ts        # 🔄 AutoDocUpdater class for documentation management
│   ├── codeTourManager.ts       # 🏗 Code tour management functionality
│   ├── contextualSearch.ts      # 🔍 Contextual search functionality
│   ├── customExplorer.ts        # 🗂 Custom explorer panel
│   ├── dependencyVisualizer.ts  # 🎨 Dependency visualization logic
│   ├── extension.ts             # 🎯 Main entry point for the extension
│   ├── githubService.ts         # 🔗 GitHub integration service
│   ├── treeViewProvider.ts      # 🌲 File explorer tree view provider
│   ├── webviewPanel.ts          # 🖥 Webview panel for displaying documentation
├── package.json                 # 📜 Extension metadata and dependencies
├── tsconfig.json                # ⚙️ TypeScript configuration
├── README.md                    # 📖 Project documentation
└── LICENSE                      # 📝 License information
```

## 📑 5. File Descriptions

- **.vscode/**: ⚙️ Contains settings specific to Visual Studio Code.
- **src/**: 📂 The main directory containing all source files.
  - **autoDocUpdater.ts**: 🔄 Manages automatic updates to documentation.
  - **codeTourManager.ts**: 🏗 Facilitates interactive tours for onboarding developers.
  - **contextualSearch.ts**: 🔍 Implements contextual search.
  - **customExplorer.ts**: 🗂 Defines a custom file explorer panel.
  - **dependencyVisualizer.ts**: 🎨 Provides tools for visualizing dependencies.
  - **extension.ts**: 🎯 Main entry point for the extension.
  - **githubService.ts**: 🔗 Handles GitHub integration.
  - **treeViewProvider.ts**: 🌲 Implements a tree view for project navigation.
  - **webviewPanel.ts**: 🖥 Manages a webview panel for interactive documentation.
- **package.json**: 📜 Contains metadata about the extension.
- **tsconfig.json**: ⚙️ TypeScript configuration file.
- **README.md**: 📖 Project documentation.
- **LICENSE**: 📝 Specifies the project's licensing terms.

## 🛠 6. Approach to Solve the Problem

Initially, we considered developing a 🌐 web-based solution. However, after evaluating the challenges developers face while navigating repositories, we decided to build a 🏗 VS Code extension for a more seamless and integrated experience.

### 🎯 Solution Highlights:
- **📜 SRS-to-Code Mapping**: Automatically link SRS requirements to relevant code sections.
- **🧭 Intelligent Navigation**: Provide structured insights into project architecture.
- **📖 Interactive Documentation**: Dynamically update documentation based on commits.
- **👨‍🏫 Guided Onboarding**: Step-by-step breakdown of project components.
- **🔍 AI-powered Search**: Contextual search to locate relevant code snippets.
- **🔗 GitHub Integration**: Sync repositories for real-time tracking.
- **🎨 Dependency Visualization**: Graphical representation of module interactions.

By embedding these features directly within VS Code, we ensure developers can 🏗 understand, explore, and contribute to projects efficiently without leaving their IDE.

## 🏗 7. Tech Stack

### 1️⃣ Core Development
- **🖥 Language**: TypeScript (for VS Code extension development)
- **🚀 Framework**: Node.js (for backend services)
- **🛠 VS Code API**: To interact with the editor and provide UI elements

### 2️⃣ GitHub Integration
- **🔗 GitHub REST API**: Fetch repositories, commits, and pull requests
- **🔍 GitHub GraphQL API**: Query structured repository data efficiently

### 3️⃣ SRS-to-Code Mapping & Search
- **🧠 LangChain.js / OpenAI API**: AI-powered code understanding and feature mapping
- **🔍 AST Parsing (Abstract Syntax Trees)**: To analyze code structure and match SRS requirements

### 4️⃣ Interactive Documentation
- **📜 Markdown & Docusaurus**: Generate and manage documentation dynamically
- **🖥 VS Code Webview API**: Display interactive documentation inside VS Code

### 5️⃣ Dependency & Architecture Visualization
- **📊 Graphviz / D3.js**: For visualizing project structure and dependencies
- **🔍 AST-based Analysis**: To map function and module interactions

## 🚀 Key Features

- **📜 SRS-to-Code Mapping**: Automatically analyze SRS documents and link them to relevant code sections.
- **🧭 Intelligent Project Navigation**: Auto-generate a project explorer that maps dependencies.
- **📖 Auto-Generated Documentation**: Real-time documentation updates based on code changes.
- **👨‍🏫 Guided Onboarding**: Interactive onboarding for new developers.
- **🔍 AI-Powered Search & Contextual Assistance**: Use AI to provide context-aware suggestions.
- **🔗 GitHub Integration**: Fetch project repositories and auto-synchronize documentation.
- **🎨 Dependency & Visualization Tools**: Provide real-time dependency graphs.

**Video Link**:[https://drive.google.com/drive/folders/13zUXEFIw_n99TtlrQAuZZdpFtgOnzIHw?usp=drive_link]

