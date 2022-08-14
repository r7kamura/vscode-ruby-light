import { Connection } from "vscode-languageserver";

export type Settings = {
  diagnostics: {
    enabled: boolean;
  };
  documentFormatting: {
    enabled: boolean;
  };
  documentHighlight: {
    enabled: boolean;
  };
  documentSymbol: {
    enabled: boolean;
  };
  selectionRanges: {
    enabled: boolean;
  };
};

export const defaultSettings: Settings = {
  diagnostics: {
    enabled: true,
  },
  documentFormatting: {
    enabled: true,
  },
  documentHighlight: {
    enabled: true,
  },
  documentSymbol: {
    enabled: true,
  },
  selectionRanges: {
    enabled: true,
  },
};

export async function getSettings(connection: Connection): Promise<Settings> {
  return connection.workspace.getConfiguration({
    section: "rubyLight",
  });
}
