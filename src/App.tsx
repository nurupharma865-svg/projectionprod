import { useState } from 'react';
import LibraryScreen from './screens/LibraryScreen';
import WorkspaceScreen from './screens/WorkspaceScreen';

export default function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  if (openProjectId) {
    return <WorkspaceScreen projectId={openProjectId} onExit={() => setOpenProjectId(null)} />;
  }

  return <LibraryScreen onOpenProject={setOpenProjectId} />;
}
