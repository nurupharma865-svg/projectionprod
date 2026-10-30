import type { DocPage, DocParagraph, DocumentContent } from './types';

const PAGE_CHARACTER_TARGET = 2000;

export class NoSelectableTextError extends Error {
  constructor() {
    super('no-selectable-text');
  }
}

export function paginateParagraphs(paragraphs: DocParagraph[]): DocumentContent {
  const pages: DocPage[] = [];
  let current: DocParagraph[] = [];
  let currentSize = 0;

  for (const paragraph of paragraphs) {
    const size = paragraph.lines.join(' ').length;
    if (current.length > 0 && currentSize + size > PAGE_CHARACTER_TARGET) {
      pages.push({ number: pages.length + 1, paragraphs: current });
      current = [];
      currentSize = 0;
    }
    current.push(paragraph);
    currentSize += size;
  }

  if (current.length > 0) {
    pages.push({ number: pages.length + 1, paragraphs: current });
  }

  return { pages };
}

export function parsePlainText(raw: string): DocumentContent {
  const paragraphs = raw
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim() !== ''))
    .filter((lines) => lines.length > 0)
    .map((lines) => ({ lines }));

  return paginateParagraphs(paragraphs);
}

export function parseHtml(html: string): DocumentContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach((node) => node.remove());

  const blocks = Array.from(
    doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, pre, blockquote, td, th, div'),
  ).filter((element) => !element.querySelector('h1, h2, h3, h4, h5, h6, p, li, pre, blockquote, td, th, div'));

  const paragraphs: DocParagraph[] = [];
  for (const block of blocks) {
    const text = (block.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text) paragraphs.push({ lines: [text] });
  }

  if (paragraphs.length === 0) {
    const fallback = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (fallback) paragraphs.push({ lines: [fallback] });
  }

  return paginateParagraphs(paragraphs);
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^```.*$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1');
}
