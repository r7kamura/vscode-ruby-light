import { Point as TreeSitterPosition } from "web-tree-sitter";
import { Position as VscodePosition } from "vscode-languageserver";

export default class Position {
  private row: number;
  private column: number;

  constructor(row: number, column: number) {
    this.row = row;
    this.column = column;
  }

  public static fromVscodePosition(position: VscodePosition): Position {
    return new Position(position.line, position.character);
  }

  public static fromTreeSitterPosition(position: TreeSitterPosition): Position {
    return new Position(position.row, position.column);
  }

  public toVscodePosition(): VscodePosition {
    return VscodePosition.create(this.row, this.column);
  }

  public toTreeSitterPosition(): TreeSitterPosition {
    return {
      row: this.row,
      column: this.column,
    };
  }
}
