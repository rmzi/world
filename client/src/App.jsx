import React from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import AudioPlayer from './components/AudioPlayer';
import Self from './pages/Self';
import { useStore } from './store';
import './index.css';

function App() {
  const { activePage } = useStore();

  return (
    <div className="app-container">
      <AudioPlayer />
      <Scene />

      {/* Overlay handles navigation, pause state, and modals */}
      <Overlay />

      {/* Page-specific DOM overlays if needed beyond what Overlay.jsx handles */}
      {activePage === 'self' && <Self />}
    </div>
  );
}

export default App;
