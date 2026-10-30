import { projectionTextStyle } from '../lib/projectionStyle';
import type { ProjectionContent } from '../lib/types';

interface ProjectionSurfaceProps {
  content: ProjectionContent | null;
  className?: string;
}

export default function ProjectionSurface({ content, className = '' }: ProjectionSurfaceProps) {
  if (!content) {
    return (
      <div className={`projection-surface projection-surface-blank ${className}`} role="status">
        <span className="projection-blank-label">Projection masquée</span>
      </div>
    );
  }

  return (
    <div
      className={`projection-surface ${className}`}
      style={{ backgroundColor: content.style.backgroundColor }}
    >
      <div className="projection-text" style={projectionTextStyle(content.style)}>
        {content.text}
      </div>
    </div>
  );
}
