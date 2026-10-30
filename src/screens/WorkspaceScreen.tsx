import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, EyeOff, Presentation, Send } from 'lucide-react';
import DocumentPane from '../components/DocumentPane';
import PointsList from '../components/PointsList';
import ProjectionPreview from '../components/ProjectionPreview';
import StyleControls from '../components/StyleControls';
import { DEFAULT_STYLE, clampZoom } from '../lib/projectionStyle';
import { openProjectionChannel, type ProjectionChannel, type ProjectionMessage } from '../lib/projectionChannel';
import {
  createPoint,
  deletePoint,
  getProject,
  listPoints,
  setPointPosition,
  updatePoint,
  type PointInput,
} from '../lib/projectsRepository';
import {
  selectionFromAnchor,
  selectionFromFreeText,
  type Anchor,
  type SelectedText,
  type UnitMode,
} from '../lib/selection';
import type { Project, ProjectionContent, ProjectionPoint, ProjectionStyle } from '../lib/types';

interface WorkspaceScreenProps {
  projectId: string;
  onExit: () => void;
}

type LoadState = 'loading' | 'ready' | 'missing' | 'error';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const UNIT_MODES: { value: UnitMode; label: string }[] = [
  { value: 'word', label: 'Mot' },
  { value: 'line', label: 'Ligne' },
  { value: 'paragraph', label: 'Paragraphe' },
  { value: 'page', label: 'Page' },
];

const SAVE_STATUS_TEXT: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  error: 'Erreur d’enregistrement',
};

function pointToInput(point: ProjectionPoint): PointInput {
  return {
    label: point.label,
    unitKind: point.unitKind,
    pageNumber: point.pageNumber,
    text: point.text,
    style: point.style,
  };
}

function isSameStyle(a: ProjectionStyle, b: ProjectionStyle): boolean {
  return (
    a.zoomPercent === b.zoomPercent &&
    a.fontFamily === b.fontFamily &&
    a.textColor === b.textColor &&
    a.backgroundColor === b.backgroundColor &&
    a.lineHeight === b.lineHeight &&
    a.bold === b.bold
  );
}

function isSameInput(a: PointInput, b: PointInput): boolean {
  return (
    a.label === b.label &&
    a.unitKind === b.unitKind &&
    a.pageNumber === b.pageNumber &&
    a.text === b.text &&
    isSameStyle(a.style, b.style)
  );
}

export default function WorkspaceScreen({ projectId, onExit }: WorkspaceScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [points, setPoints] = useState<ProjectionPoint[]>([]);
  const [unitMode, setUnitMode] = useState<UnitMode>('paragraph');
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [label, setLabel] = useState('');
  const [style, setStyle] = useState<ProjectionStyle>(DEFAULT_STYLE);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [focusPageNumber, setFocusPageNumber] = useState<number | null>(null);
  const [focusParagraphNumber, setFocusParagraphNumber] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  const channelRef = useRef<ProjectionChannel | null>(null);
  const snapshotRef = useRef<ProjectionMessage>({ type: 'content', content: null, index: -1, total: 0 });
  const navigateRef = useRef<(direction: 1 | -1) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    Promise.all([getProject(projectId), listPoints(projectId)])
      .then(([loadedProject, loadedPoints]) => {
        if (cancelled) return;
        if (!loadedProject) {
          setLoadState('missing');
          return;
        }
        setProject(loadedProject);
        setPoints(loadedPoints);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const paragraphCount = project?.content.pages.reduce((total, page) => total + page.paragraphs.length, 0) ?? 0;
  const sermonYear = project?.title.match(/^(\d{2})[-–]/)?.[1] ?? null;
  const activeIndex = points.findIndex((point) => point.id === activePointId);
  const activePoint = activeIndex >= 0 ? points[activeIndex] : null;

  const draft: PointInput | null = selected
    ? { label, unitKind: selected.unitKind, pageNumber: selected.pageNumber, text: selected.text, style }
    : null;

  const liveContent: ProjectionContent | null = isLive && draft
    ? { label: draft.label, text: draft.text, style: draft.style }
    : null;

  const isDirty = Boolean(activePoint && draft && !isSameInput(pointToInput(activePoint), draft));

  const snapshot: ProjectionMessage = { type: 'content', content: liveContent, index: activeIndex, total: points.length };
  const snapshotKey = JSON.stringify(snapshot);

  useEffect(() => {
    const channel = openProjectionChannel((message) => {
      if (message.type === 'request-content') channel.send(snapshotRef.current);
      if (message.type === 'navigate') navigateRef.current(message.direction);
    });
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    channelRef.current?.send(snapshot);
  }, [snapshotKey]);

  function showPoint(point: ProjectionPoint) {
    setSelected({ unitKind: point.unitKind, pageNumber: point.pageNumber, text: point.text, anchor: null });
    setLabel(point.label);
    setStyle(point.style);
    setActivePointId(point.id);
    setFocusPageNumber(point.pageNumber);
    setIsLive(true);
  }

  function navigate(direction: 1 | -1) {
    if (points.length === 0) return;
    const nextIndex = activeIndex === -1
      ? (direction === 1 ? 0 : points.length - 1)
      : Math.min(points.length - 1, Math.max(0, activeIndex + direction));
    showPoint(points[nextIndex]);
  }

  navigateRef.current = navigate;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        navigateRef.current(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        navigateRef.current(-1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomStep = useCallback((delta: number) => {
    setStyle((current) => ({ ...current, zoomPercent: clampZoom(current.zoomPercent + delta) }));
  }, []);

  function applyNewSelection(next: SelectedText) {
    setSelected(next);
    setLabel(`Point ${points.length + 1}`);
    setActivePointId(null);
  }

  function handlePickAnchor(anchor: Anchor) {
    if (!project) return;
    const next = selectionFromAnchor(project.content, anchor, unitMode);
    if (next) applyNewSelection(next);
  }

  function handlePickFreeText(next: SelectedText) {
    applyNewSelection(selectionFromFreeText(next.pageNumber, next.text));
  }

  function handleTextChange(text: string) {
    setSelected((current) => (current ? { ...current, text } : current));
  }

  async function runSave(task: () => Promise<void>) {
    setSaveStatus('saving');
    setNotice(null);
    try {
      await task();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      setNotice('Une modification n’a pas pu être enregistrée. Vérifiez votre connexion et réessayez.');
    }
  }

  async function handleSaveNewPoint() {
    if (!project || !draft) return;
    await runSave(async () => {
      const position = points.reduce((max, point) => Math.max(max, point.position), -1) + 1;
      const created = await createPoint(project.id, position, draft);
      setPoints((current) => [...current, created].sort((a, b) => a.position - b.position));
      setActivePointId(created.id);
      setIsLive(true);
    });
  }

  async function handleUpdatePoint() {
    if (!project || !activePoint || !draft) return;
    const target = activePoint;
    await runSave(async () => {
      await updatePoint(target.id, draft, project.id);
      setPoints((current) =>
        current.map((point) =>
          point.id === target.id
            ? { ...point, label: draft.label, unitKind: draft.unitKind, pageNumber: draft.pageNumber, text: draft.text, style: draft.style }
            : point,
        ),
      );
      setIsLive(true);
    });
  }

  async function handleDeletePoint(point: ProjectionPoint) {
    if (!project) return;
    await runSave(async () => {
      await deletePoint(point.id, project.id);
      setPoints((current) => current.filter((item) => item.id !== point.id));
      setActivePointId((current) => (current === point.id ? null : current));
    });
  }

  async function handleMovePoint(point: ProjectionPoint, direction: -1 | 1) {
    if (!project) return;
    const index = points.findIndex((item) => item.id === point.id);
    const neighbor = points[index + direction];
    if (!neighbor) return;
    await runSave(async () => {
      await Promise.all([
        setPointPosition(point.id, neighbor.position, project.id),
        setPointPosition(neighbor.id, point.position, project.id),
      ]);
      setPoints((current) =>
        current
          .map((item) => {
            if (item.id === point.id) return { ...item, position: neighbor.position };
            if (item.id === neighbor.id) return { ...item, position: point.position };
            return item;
          })
          .sort((a, b) => a.position - b.position),
      );
    });
  }

  function openProjectionWindow() {
    window.open(`${window.location.origin}${window.location.pathname}?screen=projection`, 'projetexte-projection', 'popup,width=1280,height=720');
  }

  if (loadState === 'loading') {
    return <div className="app-shell"><p className="muted centered">Chargement du projet…</p></div>;
  }

  if (loadState !== 'ready' || !project) {
    return (
      <div className="app-shell">
        <main className="container">
          <p className="error-banner" role="alert">
            {loadState === 'missing'
              ? 'Ce projet n’existe plus.'
              : 'Le projet n’a pas pu être chargé. Vérifiez votre connexion et réessayez.'}
          </p>
          <button type="button" className="btn btn-ghost" onClick={onExit}>Retour à la bibliothèque</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell workspace">
      <header className="topbar workspace-topbar">
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" />
          Bibliothèque
        </button>
        <div className="workspace-title">
          <h1>{project.title}</h1>
          <span className="muted small">{sermonYear ? `Prédication · ${sermonYear}` : 'Prédication'} · {paragraphCount} paragraphes</span>
        </div>
        <div className="topbar-actions">
          {isLive && <span className="live-badge">En direct</span>}
          <span className={`save-status save-${saveStatus}`} aria-live="polite">{SAVE_STATUS_TEXT[saveStatus]}</span>
          <button type="button" className="btn btn-secondary" onClick={openProjectionWindow}>
            <Presentation size={18} aria-hidden="true" />
            Ouvrir la projection
          </button>
        </div>
      </header>

      {notice && <p className="error-banner notice-banner" role="alert">{notice}</p>}

      <div className="workspace-body">
        <DocumentPane
          content={project.content}
          selected={selected}
          focusPageNumber={focusPageNumber}
          focusParagraphNumber={focusParagraphNumber}
          onPickAnchor={handlePickAnchor}
          onPickFreeText={handlePickFreeText}
        />

        <aside className="operator-panel">
          <section className="panel-section paragraph-navigation">
            <h2>Aller au paragraphe</h2>
            <p className="muted small">{paragraphCount} paragraphes dans cette prédication</p>
            <div className="paragraph-grid" aria-label="Navigation des paragraphes">
              {Array.from({ length: paragraphCount }, (_, index) => index + 1).map((number) => (
                <button
                  type="button"
                  key={number}
                  className={`paragraph-number ${focusParagraphNumber === number ? 'is-active' : ''}`}
                  aria-label={`Aller au paragraphe ${number}`}
                  aria-pressed={focusParagraphNumber === number}
                  onClick={() => { setFocusParagraphNumber(number); setFocusPageNumber(null); }}
                >{number}</button>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>Choisir le passage</h2>
            <div className="segmented" role="group" aria-label="Taille de la sélection">
              {UNIT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`segmented-option ${unitMode === mode.value ? 'is-active' : ''}`}
                  aria-pressed={unitMode === mode.value}
                  onClick={() => setUnitMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="muted small">Cliquez sur un mot du document, ou sélectionnez librement un passage à la souris.</p>
            <ProjectionPreview content={draft} onZoomStep={handleZoomStep} />
            <label className="field">
              <span className="field-label">Texte projeté</span>
              <textarea
                className="input textarea"
                rows={3}
                value={selected?.text ?? ''}
                disabled={!selected}
                onChange={(event) => handleTextChange(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Nom du point</span>
              <input
                className="input"
                value={label}
                disabled={!selected}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
          </section>

          <section className="panel-section">
            <h2>Mise en forme</h2>
            <StyleControls style={style} onChange={setStyle} />
          </section>

          <section className="panel-section">
            <h2>Projection</h2>
            <div className="action-row">
              {isLive ? (
                <button type="button" className="btn btn-ghost" onClick={() => setIsLive(false)}>
                  <EyeOff size={18} aria-hidden="true" />
                  Masquer la projection
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setIsLive(true)} disabled={!selected}>
                  <Send size={18} aria-hidden="true" />
                  Projeter la sélection
                </button>
              )}
              {activePoint ? (
                <button type="button" className="btn btn-secondary" onClick={handleUpdatePoint} disabled={!isDirty}>
                  Enregistrer les modifications
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={handleSaveNewPoint} disabled={!draft}>
                  Enregistrer comme point
                </button>
              )}
            </div>
          </section>

          <section className="panel-section">
            <h2>Points de projection ({points.length})</h2>
            <p className="muted small">Pendant la présentation, utilisez les flèches ← et → pour passer d’un point à l’autre.</p>
            <PointsList
              points={points}
              activePointId={activePointId}
              onSelect={showPoint}
              onMove={handleMovePoint}
              onDelete={handleDeletePoint}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
