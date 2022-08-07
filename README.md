# vscode-ruby-light

[![build](https://github.com/r7kamura/vscode-ruby-light/actions/workflows/build.yml/badge.svg)](https://github.com/r7kamura/vscode-ruby-light/actions/workflows/build.yml)

Lightweight VSCode extension for Ruby.

## Features

### Document Highlight

![demo](images/document-highlight.gif)

For control structures, highlight the corresponding keywords when pointing to them.

> The document highlight request is sent from the client to the server to resolve a document highlights for a given text document position.

- https://microsoft.github.io/language-server-protocol/specification#textDocument_documentHighlight

### Selection Ranges

![demo](images/selection-ranges.gif)

Select the appropriate range when the "Extend Selection" command is triggered.

This command has a default shortcut assigned to:

- <kbd>Ctrl + Shift + ArrowRight</kbd> for Mac
- <kbd>Ctrl + Alt + ArrowRight</kbd> for Windows

> The selection range request is sent from the client to the server to return suggested selection ranges at an array of given positions.

- https://microsoft.github.io/language-server-protocol/specification#textDocument_selectionRange

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
