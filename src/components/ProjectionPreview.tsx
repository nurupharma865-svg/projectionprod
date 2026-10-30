import { useEffect, useRef } from 'react';
import type { ProjectionContent } from '../lib/types';
import ProjectionSurface from './ProjectionSurface';

interface ProjectionPreviewProps {
  content: ProjectionContent | null;
  onZoomStep: (delta: number) => void;
}

export default function ProjectionPreview({ content, onZoomStep }: ProjectionPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const step = event.ctrlKey ? 5 : 25;
      onZoomStep(event.deltaY < 0 ? step : -step);
    }
    frame.addEventListener('wheel', handleWheel, { passive: false });
    return () => frame.removeEventListener('wheel', handleWheel);
  }, [onZoomStep]);

  return (
    <div className="preview-frame" ref={frameRef} title="Molette : zoom. Ctrl + molette : zoom précis.">
      {content ? (
        <ProjectionSurface content={content} />
      ) : (
        <div className="projection-surface projection-surface-blank">
          <span className="projection-blank-label">Sélectionnez un passage du document</span>
        </div>
      )}
    </div>
  );
}
