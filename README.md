# vscode-ruby-toys

[![build](https://github.com/r7kamura/vscode-ruby-toys/actions/workflows/build.yml/badge.svg)](https://github.com/r7kamura/vscode-ruby-toys/actions/workflows/build.yml)

Visual Studio Code extension for Ruby.

## Features

- Document Highlight
- Selection Ranges

## Development

### Structure

```
.
├── client // Language Client as VSCode extension
└── server // Language Server implemented in Node.js
```

### Set up

```
npm install
npm run compile
```

### Run

```
code .
```

and then press <kbd>F5</kbd> on VSCode workspace to a new launch Extension Development Host.
