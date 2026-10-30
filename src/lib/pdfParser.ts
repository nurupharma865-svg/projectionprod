import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { DocParagraph, DocumentContent } from './types';
import { NoSelectableTextError } from './parsers';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PositionedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function groupIntoLines(items: PositionedText[]): PositionedText[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PositionedText[][] = [];

  for (const item of sorted) {
    const current = lines[lines.length - 1];
    const reference = current?.[0];
    if (reference && Math.abs(reference.y - item.y) <= Math.max(reference.height, item.height) * 0.5) {
      current.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

function joinLine(line: PositionedText[]): string {
  let text = '';
  let previous: PositionedText | null = null;
  for (const item of line) {
    if (previous && item.x - (previous.x + previous.width) > previous.height * 0.2) {
      text += ' ';
    }
    text += item.text;
    previous = item;
  }
  return text.replace(/\s+/g, ' ').trim();
}

function buildParagraphs(lines: PositionedText[][]): DocParagraph[] {
  const paragraphs: DocParagraph[] = [];
  let currentLines: string[] = [];
  let previousY: number | null = null;
  let previousHeight = 0;

  for (const line of lines) {
    const text = joinLine(line);
    if (!text) continue;

    const y = line[0].y;
    const height = Math.max(...line.map((item) => item.height), 1);
    if (previousY !== null && previousY - y > previousHeight * 1.8 && currentLines.length > 0) {
      paragraphs.push({ lines: currentLines });
      currentLines = [];
    }

    currentLines.push(text);
    previousY = y;
    previousHeight = height;
  }

  if (currentLines.length > 0) paragraphs.push({ lines: currentLines });
  return paragraphs;
}

export async function parsePdf(data: ArrayBuffer): Promise<DocumentContent> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: DocumentContent['pages'] = [];
  let totalText = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const items: PositionedText[] = [];
    for (const item of content.items) {
      if (!('str' in item) || item.str.length === 0) continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || Math.abs(item.transform[3]),
      });
      totalText += item.str.trim().length;
    }

    const paragraphs = buildParagraphs(groupIntoLines(items));
    pages.push({ number: pageNumber, paragraphs });
  }

  if (totalText === 0) throw new NoSelectableTextError();

  return { pages };
}
