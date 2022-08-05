import * as path from "path";
import { workspace, ExtensionContext } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  new LanguageClient(
    "ruby-toys",
    "Ruby Toys",
    createServerOptions(context),
    createClientOptions()
  ).start();
}

export function deactivate(): Thenable<void> | undefined {
  return client && client.stop();
}

function createServerOptions(context: ExtensionContext): ServerOptions {
  const serverRunOptions = {
    module: context.asAbsolutePath(path.join("server", "out", "server.js")),
    transport: TransportKind.ipc,
  };

  return {
    run: serverRunOptions,
    debug: {
      ...serverRunOptions,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };
}

function createClientOptions(): LanguageClientOptions {
  return {
    documentSelector: [
      // "file" is for saved files.
      {
        language: "ruby",
        scheme: "file",
      },
      // "untitled" is for new files that have not yet been saved to disk.
      {
        language: "ruby",
        scheme: "untitled",
      },
    ],
    synchronize: {
      // Notify the server when .ruby-version is changed in the workspace.
      fileEvents: workspace.createFileSystemWatcher("**/.ruby-version"),
    },
  };
}
