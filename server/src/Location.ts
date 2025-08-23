import { Position } from "vscode-languageserver";

export default class Location {
  public source: string;
  public startOffset: number;

  static fromPosition(source: string, position: Position): Location {
    const lines = source.split("\n");
    let offset = 0;
    
    // Add byte offsets for complete lines before target line
    for (let i = 0; i < position.line; i++) {
      offset += Buffer.from(lines[i], 'utf8').length + 1; // +1 for newline
    }
    
    // For UTF-8, position.character represents byte offset, not character count
    // Add the byte offset within the target line
    if (position.line < lines.length) {
      const targetLine = lines[position.line];
      const targetLineBytes = Buffer.from(targetLine, 'utf8');
      
      // Ensure we don't exceed the line length
      const charPosition = Math.min(position.character, targetLineBytes.length);
      offset += charPosition;
    } else {
      // If line doesn't exist, just add the character position
      offset += position.character;
    }
    
    return new Location(source, offset);
  }

  constructor(source: string, offset: number) {
    this.startOffset = offset;
    this.source = source;
  }

  public position(): Position {
    const sourceBytes = Buffer.from(this.source, 'utf8');
    const lines = this.source.split("\n");
    let currentOffset = 0;
    let line = 0;
    
    // Find which line the offset falls in
    for (let i = 0; i < lines.length; i++) {
      const lineBytes = Buffer.from(lines[i], 'utf8');
      const lineEndOffset = currentOffset + lineBytes.length;
      
      if (this.startOffset <= lineEndOffset) {
        line = i;
        break;
      }
      
      currentOffset = lineEndOffset + 1; // +1 for newline
      line = i + 1;
    }
    
    // Calculate character position within the line (as byte offset)
    const character = this.startOffset - currentOffset;
    
    return Position.create(line, Math.max(0, character));
  }
}
