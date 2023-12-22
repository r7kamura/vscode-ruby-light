import { Position } from "vscode-languageserver";

export default class Location {
  public source: string;
  public startOffset: number;

  static fromPosition(source: string, position: Position): Location {
    const lines = source.split("\n");
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1;
    }
    offset += position.character;
    return new Location(source, offset);
  }

  constructor(source: string, offset: number) {
    this.startOffset = offset;
    this.source = source;
  }

  public position(): Position {
    const lines = this.source.slice(0, this.startOffset).split("\n");
    const line = lines.length - 1;
    const character = lines[lines.length - 1].length;
    return Position.create(line, character);
  }
}
