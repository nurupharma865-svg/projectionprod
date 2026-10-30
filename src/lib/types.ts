export type SourceType = 'pdf' | 'txt' | 'md' | 'html' | 'docx';

export type UnitKind = 'word' | 'line' | 'paragraph' | 'page' | 'free';

export interface DocParagraph {
  lines: string[];
}

export interface DocPage {
  number: number;
  paragraphs: DocParagraph[];
}

export interface DocumentContent {
  pages: DocPage[];
}

export interface ProjectionStyle {
  zoomPercent: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  lineHeight: number;
  bold: boolean;
}

export interface ProjectSummary {
  id: string;
  title: string;
  sourceType: SourceType;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectSummary {
  content: DocumentContent;
}

export interface ProjectionPoint {
  id: string;
  projectId: string;
  position: number;
  label: string;
  unitKind: UnitKind;
  pageNumber: number;
  text: string;
  style: ProjectionStyle;
}

export interface ProjectionContent {
  label: string;
  text: string;
  style: ProjectionStyle;
}
