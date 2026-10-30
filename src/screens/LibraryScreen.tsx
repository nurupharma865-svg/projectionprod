import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Smartphone, Trash2, Upload } from 'lucide-react';
import PasteTextDialog from '../components/PasteTextDialog';
import PhonePairingDialog from '../components/PhonePairingDialog';
import { useRemoteUploads } from '../hooks/useRemoteUploads';
import { ACCEPTED_FILE_TYPES, importDocument } from '../lib/importDocument';
import { importErrorMessage } from '../lib/importErrors';
import { createProject, deleteProject, listProjects } from '../lib/projectsRepository';
import { getRemoteCode } from '../lib/remoteSession';
import type { ProjectSummary } from '../lib/types';

interface LibraryScreenProps {
  onOpenProject: (id: string) => void;
}

const SOURCE_LABELS: Record<ProjectSummary['sourceType'], string> = {
  pdf: 'PDF',
  txt: 'Texte',
  md: 'Markdown',
  html: 'HTML',
  docx: 'Word',
};

export default function LibraryScreen({ onOpenProject }: LibraryScreenProps) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
  const [incoming, setIncoming] = useState<ProjectSummary[]>([]);
  const [remoteCode] = useState(getRemoteCode);
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const orderedProjects = projects ? [...projects].sort((a, b) => {
    const yearA = Number(a.title.match(/^(\d{2})[-–]/)?.[1] ?? 0);
    const yearB = Number(b.title.match(/^(\d{2})[-–]/)?.[1] ?? 0);
    return yearB - yearA || a.title.localeCompare(b.title, 'fr');
  }) : null;

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setLoadError('Impossible de charger vos projets. Vérifiez votre connexion et rechargez la page.'));
  }, []);

  const handleReceived = useCallback((received: ProjectSummary[]) => {
    setIncoming((current) => [...received, ...current]);
    setProjects((current) => {
      if (!current) return current;
      const ids = new Set(received.map((project) => project.id));
      return [...received, ...current.filter((project) => !ids.has(project.id))];
    });
  }, []);
  const phoneSyncError = useRemoteUploads(remoteCode, handleReceived);

  async function handleFile(file: File) {
    setImporting(true);
    setImportError(null);
    try {
      const imported = await importDocument(file);
      const project = await createProject(imported);
      onOpenProject(project.id);
    } catch (error) {
      setImportError(importErrorMessage(error));
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects((current) => current?.filter((project) => project.id !== id) ?? null);
      setPendingDeleteId(null);
    } catch {
      setLoadError('Le projet n’a pas pu être supprimé. Réessayez.');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">ProjeTexte</div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Votre bibliothèque</h1>
          <p className="muted">Importez un document, choisissez le passage à projeter et affichez-le en grand sur un second écran.</p>
        </section>

        <section
          className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file && !importing) void handleFile(file);
          }}
        >
          <Upload size={32} aria-hidden="true" />
          <p className="dropzone-title">Glissez un fichier ici</p>
          <p className="muted small">PDF, TXT, Markdown, Word (DOCX) ou HTML</p>
          <div className="dropzone-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInput.current?.click()}
              disabled={importing}
            >
              {importing ? 'Import en cours…' : 'Choisir un fichier'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPaste(true)} disabled={importing}>
              <ClipboardPaste size={18} aria-hidden="true" />
              Coller du texte
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPairing(true)} disabled={importing}>
              <Smartphone size={18} aria-hidden="true" />
              Connecter un téléphone
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleFile(file);
            }}
          />
          {importError && <p className="error-banner" role="alert">{importError}</p>}
        </section>

        {incoming.length > 0 && (
          <section className="incoming-banner" role="status" aria-label="Documents reçus du téléphone">
            <p className="incoming-title">Reçu depuis votre téléphone</p>
            <ul className="incoming-list">
              {incoming.map((project) => (
                <li key={project.id} className="incoming-item">
                  <span className="incoming-name">{project.title}</span>
                  <button type="button" className="btn btn-primary btn-small" onClick={() => onOpenProject(project.id)}>
                    Ouvrir
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setIncoming([])}>
              Masquer
            </button>
          </section>
        )}

        {phoneSyncError && (
          <p className="error-banner" role="alert">
            Synchronisation avec le téléphone interrompue. Nouvelle tentative en cours…
          </p>
        )}

        <section className="projects-section" aria-labelledby="projects-title">
          <h2 id="projects-title">Projets récents</h2>

          {loadError && <p className="error-banner" role="alert">{loadError}</p>}

          {projects === null && !loadError && <p className="muted">Chargement…</p>}

          {projects?.length === 0 && (
            <p className="muted empty-state">Aucun projet pour le moment. Importez un document pour commencer.</p>
          )}

          {orderedProjects && orderedProjects.length > 0 && (
            <ul className="project-grid">
              {orderedProjects.map((project) => (
                <li key={project.id} className="project-card">
                  <button type="button" className="project-open" onClick={() => onOpenProject(project.id)}>
                    <span className="sermon-year" aria-label={`Année 19${project.title.match(/^(\d{2})[-–]/)?.[1] ?? '??'}`}>
                      {project.title.match(/^(\d{2})[-–]/)?.[1] ?? '—'}
                    </span>
                    <span className="project-card-content">
                      <span className="project-title">{project.title}</span>
                      <span className="project-meta">
                        {SOURCE_LABELS[project.sourceType]} · {project.pageCount} page{project.pageCount > 1 ? 's' : ''}
                      </span>
                      <span className="project-meta">
                        Modifié le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                  </button>
                  <div className="project-actions">
                    {pendingDeleteId === project.id ? (
                      <>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(project.id)}>
                          Confirmer la suppression
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setPendingDeleteId(null)}>
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => setPendingDeleteId(project.id)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {showPaste && (
        <PasteTextDialog
          onClose={() => setShowPaste(false)}
          onCreated={(project) => onOpenProject(project.id)}
        />
      )}

      {showPairing && <PhonePairingDialog code={remoteCode} onClose={() => setShowPairing(false)} />}
    </div>
  );
}
