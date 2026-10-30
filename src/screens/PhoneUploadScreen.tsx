import { useRef, useState, type FormEvent } from 'react';
import { FileUp, Send } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, importDocument, type ImportedDocument } from '../lib/importDocument';
import { importErrorMessage } from '../lib/importErrors';
import { parsePlainText } from '../lib/parsers';
import { createProject } from '../lib/projectsRepository';
import { REMOTE_CODE_PATTERN } from '../lib/remoteSession';

interface PhoneUploadScreenProps {
  code: string;
}

type UploadStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; title: string }
  | { kind: 'error'; message: string };

export default function PhoneUploadScreen({ code }: PhoneUploadScreenProps) {
  const [status, setStatus] = useState<UploadStatus>({ kind: 'idle' });
  const [title, setTitle] = useState('Texte collé');
  const [text, setText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  if (!REMOTE_CODE_PATTERN.test(code)) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">ProjeTexte</div>
        </header>
        <main className="container phone-container">
          <p className="error-banner" role="alert">
            Ce lien n’est pas valide. Scannez à nouveau le QR code affiché sur l’ordinateur.
          </p>
        </main>
      </div>
    );
  }

  const sending = status.kind === 'sending';

  async function send(build: () => Promise<ImportedDocument>) {
    setStatus({ kind: 'sending' });
    let imported: ImportedDocument;
    try {
      imported = await build();
    } catch (error) {
      setStatus({ kind: 'error', message: importErrorMessage(error) });
      return;
    }
    try {
      const project = await createProject(imported, code);
      setStatus({ kind: 'sent', title: project.title });
      setText('');
    } catch {
      setStatus({ kind: 'error', message: 'L’envoi a échoué. Vérifiez votre connexion et réessayez.' });
    }
  }

  function handlePasteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = parsePlainText(text);
    if (content.pages.length === 0) {
      setStatus({ kind: 'error', message: 'Collez ou saisissez du texte avant de l’envoyer.' });
      return;
    }
    void send(async () => ({ title: title.trim() || 'Texte collé', sourceType: 'txt', content }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">ProjeTexte</div>
      </header>

      <main className="container phone-container">
        <section className="hero">
          <h1>Envoyer à l’ordinateur</h1>
          <p className="muted">Le document apparaîtra dans la bibliothèque de l’ordinateur, prêt à être projeté.</p>
        </section>

        {status.kind === 'sent' && (
          <section className="success-banner" role="status">
            <p className="success-title">Envoyé</p>
            <p className="small">« {status.title} » est arrivé sur l’ordinateur.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setStatus({ kind: 'idle' })}>
              Envoyer un autre document
            </button>
          </section>
        )}

        {status.kind === 'error' && (
          <p className="error-banner" role="alert">{status.message}</p>
        )}

        <section className="phone-card" aria-labelledby="file-upload-title">
          <h2 id="file-upload-title">Envoyer un fichier</h2>
          <p className="muted small">PDF, TXT, Markdown, Word (DOCX) ou HTML</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => fileInput.current?.click()}
            disabled={sending}
          >
            <FileUp size={18} aria-hidden="true" />
            {sending ? 'Envoi en cours…' : 'Choisir un fichier'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void send(() => importDocument(file));
            }}
          />
        </section>

        <form className="phone-card" aria-labelledby="paste-upload-title" onSubmit={handlePasteSubmit}>
          <h2 id="paste-upload-title">Coller du texte</h2>
          <label className="field">
            <span className="field-label">Titre</span>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Texte</span>
            <textarea
              className="input textarea"
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Collez votre texte ici"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
            <Send size={18} aria-hidden="true" />
            {sending ? 'Envoi en cours…' : 'Envoyer le texte'}
          </button>
        </form>
      </main>
    </div>
  );
}
