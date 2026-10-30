import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import PhoneUploadScreen from './screens/PhoneUploadScreen';
import ProjectionScreen from './screens/ProjectionScreen';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const remoteCode = params.get('remote');

let view;
if (params.get('screen') === 'projection') {
  view = <ProjectionScreen />;
} else if (remoteCode !== null) {
  view = <PhoneUploadScreen code={remoteCode} />;
} else {
  view = <App />;
}

createRoot(document.getElementById('root')!).render(<StrictMode>{view}</StrictMode>);
