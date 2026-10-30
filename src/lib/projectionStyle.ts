import type { CSSProperties } from 'react';
import type { ProjectionStyle, UnitKind } from './types';

export const DEFAULT_STYLE: ProjectionStyle = {
  zoomPercent: 300,
  fontFamily: 'Arial',
  textColor: '#111111',
  backgroundColor: '#ffffff',
  lineHeight: 1.5,
  bold: false,
};

export const MIN_ZOOM_PERCENT = 100;
export const MAX_ZOOM_PERCENT = 800;
export const BASE_FONT_PX = 16;

export const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
];

export const CONTRAST_PRESETS: { label: string; textColor: string; backgroundColor: string }[] = [
  { label: 'Noir sur blanc', textColor: '#111111', backgroundColor: '#ffffff' },
  { label: 'Blanc sur noir', textColor: '#ffffff', backgroundColor: '#000000' },
  { label: 'Jaune sur noir', textColor: '#ffe600', backgroundColor: '#000000' },
  { label: 'Noir sur crème', textColor: '#1f1a14', backgroundColor: '#f7f1e3' },
];

export const UNIT_LABELS: Record<UnitKind, string> = {
  word: 'Mot',
  line: 'Ligne',
  paragraph: 'Paragraphe',
  page: 'Page',
  free: 'Sélection libre',
};

const REFERENCE_SCREEN_WIDTH_PX = 1920;

export function projectionTextStyle(style: ProjectionStyle): CSSProperties {
  return {
    fontFamily: FONT_OPTIONS.find((option) => option.label === style.fontFamily)?.value ?? style.fontFamily,
    fontSize: `${(BASE_FONT_PX * style.zoomPercent) / REFERENCE_SCREEN_WIDTH_PX}cqw`,
    lineHeight: style.lineHeight,
    color: style.textColor,
    backgroundColor: style.backgroundColor,
    fontWeight: style.bold ? 700 : 400,
  };
}

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, Math.round(value)));
}
