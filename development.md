# Development

Development guide.

## Structure

```
.
├── client // VSCode extension
└── server // Language Server implemented in Node.js
```

## Set up

Install NPM dependencies.

```
npm install
npm run compile
```

## Run

Launch VSCode workspace, then press <kbd>F5</kbd> to launch a new Extension Development Host instance.

```
code .
```

See the [official docs](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for more details.

## Local installation

```
npx @vscode/vsce package
code --install-extension vscode-ruby-light-*.vsix
```

## Publish

```
npx @vscode/vsce publish
```
