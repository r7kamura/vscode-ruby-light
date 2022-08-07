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

Install NPM dependencies.

```
npm install
```

### Run

Launch VSCode workspace

```
code .
```

then press press <kbd>F5</kbd> to launch a new Extension Development Host instance.
This instance will be started with the extension installed.
See the [official docs](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for more details.
