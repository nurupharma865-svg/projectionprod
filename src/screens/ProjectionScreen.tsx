import { useEffect, useRef, useState } from 'react';
import ProjectionSurface from '../components/ProjectionSurface';
import { openProjectionChannel, type ProjectionChannel, type ProjectionMessage } from '../lib/projectionChannel';
import type { ProjectionContent } from '../lib/types';

export default function ProjectionScreen() {
  const [content, setContent] = useState<ProjectionContent | null>(null);
  const channelRef = useRef<ProjectionChannel | null>(null);

  useEffect(() => {
    const channel = openProjectionChannel((message: ProjectionMessage) => {
      if (message.type === 'content') setContent(message.content);
    });
    channelRef.current = channel;
    channel.send({ type: 'request-content' });
    return () => channel.close();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        channelRef.current?.send({ type: 'navigate', direction: 1 });
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        channelRef.current?.send({ type: 'navigate', direction: -1 });
      } else if (event.key === 'f' || event.key === 'F') {
        toggleFullscreen();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ProjectionSurface
      content={content}
      className="projection-screen"
    />
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}
