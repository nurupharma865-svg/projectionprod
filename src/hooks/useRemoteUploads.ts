import { useEffect, useState } from 'react';
import { listRemoteProjects } from '../lib/projectsRepository';
import type { ProjectSummary } from '../lib/types';

const POLL_INTERVAL_MS = 4000;

export function useRemoteUploads(remoteCode: string, onReceived: (projects: ProjectSummary[]) => void): boolean {
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let baselineReady = false;
    const known = new Set<string>();

    async function poll() {
      try {
        const projects = await listRemoteProjects(remoteCode);
        if (cancelled) return;
        setConnectionError(false);
        const fresh = projects.filter((project) => !known.has(project.id));
        fresh.forEach((project) => known.add(project.id));
        if (baselineReady && fresh.length > 0) onReceived(fresh);
        baselineReady = true;
      } catch {
        if (!cancelled) setConnectionError(true);
      }
    }

    void poll();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [remoteCode, onReceived]);

  return connectionError;
}
