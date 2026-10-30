import type { DocumentContent, SourceType } from './types';
import { parseHtml, parsePlainText, stripMarkdown } from './parsers';

export interface ImportedDocument {
  title: string;
  sourceType: SourceType;
  content: DocumentContent;
}

const SUPPORTED_EXTENSIONS: Record<string, SourceType> = {
  pdf: 'pdf',
  txt: 'txt',
  md: 'md',
  markdown: 'md',
  html: 'html',
  htm: 'html',
  docx: 'docx',
};

export const ACCEPTED_FILE_TYPES = Object.keys(SUPPORTED_EXTENSIONS).map((ext) => `.${ext}`).join(',');

export class UnsupportedFileError extends Error {
  constructor() {
    super('unsupported-file');
  }
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'Document sans titre';
}

export async function importDocument(file: File): Promise<ImportedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const sourceType = SUPPORTED_EXTENSIONS[extension];
  if (!sourceType) throw new UnsupportedFileError();

  const title = titleFromFileName(file.name);

  if (sourceType === 'pdf') {
    const { parsePdf } = await import('./pdfParser');
    return { title, sourceType, content: await parsePdf(await file.arrayBuffer()) };
  }

  if (sourceType === 'docx') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    return { title, sourceType, content: parseHtml(result.value) };
  }

  const raw = await file.text();

  if (sourceType === 'html') {
    return { title, sourceType, content: parseHtml(raw) };
  }

  if (sourceType === 'md') {
    return { title, sourceType, content: parsePlainText(stripMarkdown(raw)) };
  }

  return { title, sourceType, content: parsePlainText(raw) };
}
