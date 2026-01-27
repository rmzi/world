import React, { useState } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import AudioPlayer from './components/AudioPlayer';
import { useStore } from './store';
import { Leva } from 'leva';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  const { activePage } = useStore();
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="app-container">
      {/* Settings toggle button */}
      <button
        className="settings-btn"
        onClick={() => setShowControls(!showControls)}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: 'none',
          background: showControls ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          opacity: 0.7,
        }}
        title="Toggle controls"
      >
        ⚙︎
      </button>

      <Leva
        flat
        hidden={!showControls}
        collapsed={false}
        titleBar={false}
        theme={{
          colors: {
            accent1: 'white',
            accent2: '#ff4081',
            accent3: '#333',
            highlight1: '#eee',
            highlight2: '#ccc',
            highlight3: '#999',
            vivid1: '#ff4081',
            elevation1: '#111',
            elevation2: '#050505',
            elevation3: '#222'
          },
          sizes: {
            rootWidth: '280px',
            controlWidth: '160px'
          }
        }}
      />
      <AudioPlayer />

      <ErrorBoundary name="3D Scene">
        <Scene />
      </ErrorBoundary>

      <ErrorBoundary name="UI Overlay">
        <Overlay />
      </ErrorBoundary>
    </div>
  );
}

export default App;
