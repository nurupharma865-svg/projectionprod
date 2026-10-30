import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { parsePlainText } from '../lib/parsers';
import { createProject } from '../lib/projectsRepository';
import type { ProjectSummary } from '../lib/types';

interface PasteTextDialogProps {
  onClose: () => void;
  onCreated: (project: ProjectSummary) => void;
}

export default function PasteTextDialog({ onClose, onCreated }: PasteTextDialogProps) {
  const [title, setTitle] = useState('Texte collé');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = parsePlainText(text);
    if (content.pages.length === 0) {
      setError('Collez ou saisissez du texte avant de créer le projet.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const project = await createProject({
        title: title.trim() || 'Texte collé',
        sourceType: 'txt',
        content,
      });
      onCreated(project);
    } catch {
      setError('Le projet n’a pas pu être créé. Vérifiez votre connexion et réessayez.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paste-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2 id="paste-dialog-title">Coller du texte</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <label className="field">
          <span className="field-label">Titre du projet</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Texte</span>
          <textarea
            className="input textarea"
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Collez votre texte ici"
          />
        </label>

        {error && <p className="error-banner" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Création…' : 'Créer le projet'}
          </button>
        </div>
      </form>
    </div>
  );
}
