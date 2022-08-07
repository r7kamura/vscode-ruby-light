# vscode-ruby-light

[![build](https://github.com/r7kamura/vscode-ruby-light/actions/workflows/build.yml/badge.svg)](https://github.com/r7kamura/vscode-ruby-light/actions/workflows/build.yml)

Lightweight VSCode extension for Ruby.

## Install

Install via Visual Studio Marketplace:

- [Ruby Light - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=r7kamura.vscode-ruby-light)

## Features

### Document Highlight

![demo](images/document-highlight.gif)

For control structures, highlight the corresponding keywords when pointing to them.

### Selection Ranges

![demo](images/selection-ranges.gif)

Select the appropriate range when the "Extend Selection" command is triggered.

This command has a default shortcut assigned to:

- <kbd>Ctrl + Shift + ArrowRight</kbd> for Mac
- <kbd>Ctrl + Alt + ArrowRight</kbd> for Windows

## Development

### Structure

```
.
├── client // VSCode extension
└── server // Language Server implemented in Node.js
```

### Set up

Install NPM dependencies.

```
npm install
npm run compile
```

### Run

Launch VSCode workspace, then press <kbd>F5</kbd> to launch a new Extension Development Host instance.

```
code .
```

See the [official docs](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for more details.

### Local installation

```
npx vsce package
code --install-extension vscode-ruby-light-*.vsix
```
