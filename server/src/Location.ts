import { Position } from "vscode-languageserver";

export default class Location {
  public source: string;
  public startOffset: number;

  static fromPosition(source: string, position: Position): Location {
    const lines = source.split("\n");
    let characterOffset = 0;
    for (let i = 0; i < position.line; i++) {
      characterOffset += lines[i].length + 1;
    }
    characterOffset += position.character;

    // Convert character position to byte offset for Prism compatibility
    const byteOffset = this.characterOffsetToByteOffset(
      source,
      characterOffset
    );
    return new Location(source, byteOffset);
  }

  constructor(source: string, offset: number) {
    this.startOffset = offset;
    this.source = source;
  }

  public position(): Position {
    // Convert byte offset to character offset first
    const characterOffset = Location.byteOffsetToCharacterOffset(
      this.source,
      this.startOffset
    );

    const lines = this.source.split("\n");
    let currentCharacterOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length;

      if (characterOffset <= currentCharacterOffset + lineLength) {
        const character = characterOffset - currentCharacterOffset;
        return Position.create(line, character);
      }

      // Add 1 for the newline character
      currentCharacterOffset += lineLength + 1;
    }

    // Fallback to end of file if offset is beyond content
    const lastLine = lines.length - 1;
    return Position.create(lastLine, lines[lastLine].length);
  }

  /**
   * Convert byte offset to character offset, handling multibyte characters properly
   */
  static byteOffsetToCharacterOffset(
    source: string,
    byteOffset: number
  ): number {
    if (byteOffset <= 0) {
      return 0;
    }

    const buffer = Buffer.from(source, "utf8");
    if (byteOffset >= buffer.length) {
      return source.length;
    }

    // Find the nearest valid character boundary at or before the byte offset
    for (let i = byteOffset; i >= 0; i--) {
      try {
        const slice = buffer.slice(0, i);
        const text = slice.toString("utf8");

        // Check if the conversion is valid (no replacement characters)
        if (!text.includes("\uFFFD")) {
          return text.length;
        }
      } catch (error) {
        // Continue to previous byte position
      }
    }

    return 0;
  }

  /**
   * Convert character offset to byte offset
   */
  static characterOffsetToByteOffset(
    source: string,
    characterOffset: number
  ): number {
    if (characterOffset <= 0) {
      return 0;
    }

    if (characterOffset >= source.length) {
      return Buffer.from(source, "utf8").length;
    }

    const substring = source.slice(0, characterOffset);
    return Buffer.from(substring, "utf8").length;
  }
}
