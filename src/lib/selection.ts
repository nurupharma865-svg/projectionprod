import type { DocumentContent, UnitKind } from './types';

export type UnitMode = Exclude<UnitKind, 'free'>;

export interface Anchor {
  pageNumber: number;
  paragraphIndex: number;
  lineIndex: number;
  tokenIndex: number;
}

export interface SelectedText {
  unitKind: UnitKind;
  pageNumber: number;
  text: string;
  anchor: Anchor | null;
}

export function tokenizeLine(line: string): string[] {
  return line.split(/(\s+)/);
}

export function isWordToken(token: string): boolean {
  return token.trim() !== '';
}

export function selectionFromAnchor(content: DocumentContent, anchor: Anchor, mode: UnitMode): SelectedText | null {
  const page = content.pages.find((candidate) => candidate.number === anchor.pageNumber);
  const paragraph = page?.paragraphs[anchor.paragraphIndex];
  const line = paragraph?.lines[anchor.lineIndex];
  if (!page || !paragraph || line === undefined) return null;

  const tokens = tokenizeLine(line);
  const word = tokens[anchor.tokenIndex];
  if (word === undefined) return null;

  const textByMode: Record<UnitMode, string> = {
    word: word.trim(),
    line: line.trim(),
    paragraph: paragraph.lines.join(' ').trim(),
    page: page.paragraphs.map((item) => item.lines.join(' ')).join('\n\n').trim(),
  };

  return {
    unitKind: mode,
    pageNumber: anchor.pageNumber,
    text: textByMode[mode],
    anchor,
  };
}

export function selectionFromFreeText(pageNumber: number, text: string): SelectedText {
  return { unitKind: 'free', pageNumber, text: text.trim(), anchor: null };
}

export function isAnchorInUnit(selected: SelectedText | null, candidate: Anchor): boolean {
  const anchor = selected?.anchor;
  if (!selected || !anchor) return false;
  if (anchor.pageNumber !== candidate.pageNumber) return false;
  if (selected.unitKind === 'page') return true;
  if (anchor.paragraphIndex !== candidate.paragraphIndex) return false;
  if (selected.unitKind === 'paragraph') return true;
  if (anchor.lineIndex !== candidate.lineIndex) return false;
  if (selected.unitKind === 'line') return true;
  return anchor.tokenIndex === candidate.tokenIndex;
}
