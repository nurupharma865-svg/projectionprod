import { useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { UNIT_LABELS } from '../lib/projectionStyle';
import type { ProjectionPoint } from '../lib/types';

interface PointsListProps {
  points: ProjectionPoint[];
  activePointId: string | null;
  onSelect: (point: ProjectionPoint) => void;
  onMove: (point: ProjectionPoint, direction: -1 | 1) => void;
  onDelete: (point: ProjectionPoint) => void;
}

export default function PointsList({ points, activePointId, onSelect, onMove, onDelete }: PointsListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (points.length === 0) {
    return (
      <p className="muted small">
        Aucun point enregistré. Sélectionnez un passage puis cliquez sur « Enregistrer comme point ».
      </p>
    );
  }

  return (
    <ol className="points-list">
      {points.map((point, index) => (
        <li key={point.id} className={`point-item ${point.id === activePointId ? 'is-active' : ''}`}>
          <button type="button" className="point-main" onClick={() => onSelect(point)}>
            <span className="point-label">
              {index + 1}. {point.label}
            </span>
            <span className="point-meta">
              Page {point.pageNumber} · {UNIT_LABELS[point.unitKind]} · {point.style.zoomPercent} %
            </span>
            <span className="point-excerpt">{point.text}</span>
          </button>
          <div className="point-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => onMove(point, -1)}
              disabled={index === 0}
              aria-label="Monter ce point"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => onMove(point, 1)}
              disabled={index === points.length - 1}
              aria-label="Descendre ce point"
            >
              <ArrowDown size={16} />
            </button>
            {pendingDeleteId === point.id ? (
              <button type="button" className="btn btn-danger btn-small" onClick={() => onDelete(point)}>
                Supprimer
              </button>
            ) : (
              <button
                type="button"
                className="icon-button"
                onClick={() => setPendingDeleteId(point.id)}
                aria-label="Supprimer ce point"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
