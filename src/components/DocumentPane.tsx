import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import type { DocumentContent } from '../lib/types';
import {
  isAnchorInUnit,
  isWordToken,
  selectionFromFreeText,
  tokenizeLine,
  type Anchor,
  type SelectedText,
} from '../lib/selection';

interface DocumentPaneProps {
  content: DocumentContent;
  selected: SelectedText | null;
  focusPageNumber: number | null;
  focusParagraphNumber: number | null;
  onPickAnchor: (anchor: Anchor) => void;
  onPickFreeText: (selection: SelectedText) => void;
}

export default function DocumentPane({
  content,
  selected,
  focusPageNumber,
  focusParagraphNumber,
  onPickAnchor,
  onPickFreeText,
}: DocumentPaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusPageNumber === null) return;
    paneRef.current
      ?.querySelector(`[data-page="${focusPageNumber}"]`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [focusPageNumber]);

  useEffect(() => {
    if (focusParagraphNumber === null) return;
    paneRef.current
      ?.querySelector(`[data-paragraph-number="${focusParagraphNumber}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusParagraphNumber]);

  function handleMouseUp(event: ReactMouseEvent<HTMLDivElement>) {
    const domSelection = window.getSelection();
    const text = domSelection?.toString().trim();
    if (!domSelection || !text || !paneRef.current?.contains(domSelection.anchorNode)) return;

    const anchorElement = domSelection.anchorNode instanceof Element
      ? domSelection.anchorNode
      : domSelection.anchorNode?.parentElement;
    const pageElement = anchorElement?.closest('[data-page]');
    const pageNumber = Number(pageElement?.getAttribute('data-page') ?? content.pages[0]?.number ?? 1);
    onPickFreeText(selectionFromFreeText(pageNumber, text));
    event.stopPropagation();
  }

  return (
    <div className="doc-pane" ref={paneRef} onMouseUp={handleMouseUp}>
      {content.pages.map((page) => (
        <section key={page.number} className="doc-page" data-page={page.number}>
          <div className="doc-page-number">Page {page.number}</div>
          {page.paragraphs.map((paragraph, paragraphIndex) => {
            const pageIndex = content.pages.findIndex((item) => item.number === page.number);
            const globalParagraphNumber = content.pages.slice(0, pageIndex)
              .reduce((total, item) => total + item.paragraphs.length, 0) + paragraphIndex + 1;
            return (
            <p key={paragraphIndex} className="doc-paragraph" data-paragraph-number={globalParagraphNumber}>
              {paragraph.lines.map((line, lineIndex) => (
                <span key={lineIndex} className="doc-line">
                  {tokenizeLine(line).map((token, tokenIndex) => {
                    const anchor: Anchor = { pageNumber: page.number, paragraphIndex, lineIndex, tokenIndex };
                    const highlighted = isAnchorInUnit(selected, anchor);
                    if (!isWordToken(token)) {
                      return (
                        <span key={tokenIndex} className={highlighted ? 'is-selected' : undefined}>
                          {token}
                        </span>
                      );
                    }
                    return (
                      <button
                        key={tokenIndex}
                        type="button"
                        className={`word ${highlighted ? 'is-selected' : ''}`}
                        onClick={() => onPickAnchor(anchor)}
                      >
                        {token}
                      </button>
                    );
                  })}
                </span>
              ))}
            </p>
            );
          })}
        </section>
      ))}
    </div>
  );
}
