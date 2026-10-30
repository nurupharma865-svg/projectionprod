import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import { X } from 'lucide-react';
import { buildRemoteUrl } from '../lib/remoteSession';

interface PhonePairingDialogProps {
  code: string;
  onClose: () => void;
}

export default function PhonePairingDialog({ code, onClose }: PhonePairingDialogProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    toDataURL(buildRemoteUrl(code), { width: 280, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrSrc(url);
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal pairing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pairing-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="pairing-dialog-title">Connecter un téléphone</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <p className="muted">
          Scannez ce code avec l’appareil photo de votre téléphone. La page d’envoi s’ouvre directement, et les documents
          envoyés apparaissent ici.
        </p>

        <div className="pairing-qr">
          {qrSrc && <img src={qrSrc} width={280} height={280} alt="QR code de connexion du téléphone" />}
          {!qrSrc && !qrError && <p className="muted small">Génération du code…</p>}
          {qrError && (
            <p className="error-banner" role="alert">Le QR code n’a pas pu être généré. Rechargez la page.</p>
          )}
        </div>

        <p className="pairing-code-label small muted">Code de connexion</p>
        <p className="pairing-code">{code}</p>
      </div>
    </div>
  );
}
