import type { ProjectionContent } from './types';

export type ProjectionMessage =
  | { type: 'content'; content: ProjectionContent | null; index: number; total: number }
  | { type: 'request-content' }
  | { type: 'navigate'; direction: 1 | -1 };

const CHANNEL_NAME = 'projetexte-projection';

export interface ProjectionChannel {
  send: (message: ProjectionMessage) => void;
  close: () => void;
}

export function openProjectionChannel(onMessage: (message: ProjectionMessage) => void): ProjectionChannel {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<ProjectionMessage>) => onMessage(event.data);
  return {
    send: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}
