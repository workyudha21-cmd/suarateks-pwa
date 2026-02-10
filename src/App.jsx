import { useState, useEffect } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import './index.css';

import { WifiOff } from 'lucide-react';

function App() {
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening, 
    clearTranscript,
    error 
  } = useSpeechRecognition();

  const [wakeLock, setWakeLock] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Request Wake Lock to prevent screen from sleeping
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    if (isListening) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release().then(() => {
          setWakeLock(null);
          console.log('Wake Lock released');
        });
      }
    }
  }, [isListening]);

  return (
    <>
      <header>
        <h1>SuaraTeks</h1>
        <div className={`status-indicator ${isListening ? 'listening' : ''}`}></div>
      </header>

      <main>
        <div className="transcript-container">
          {transcript || interimTranscript ? (
            <div className="transcript-text">
              {transcript} <span className="interim-text">{interimTranscript}</span>
            </div>
          ) : (
            <div className="empty-state">
              {!isOnline ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <WifiOff size={48} color="var(--error-color)" />
                  <p>Koneksi internet terputus.<br/>Fitur ini membutuhkan internet.</p>
                </div>
              ) : (
                "Tekan tombol mikrofon dan mulai berbicara..."
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--error-color)', textAlign: 'center', marginBottom: '1rem' }}>
            Error: {error}
          </div>
        )}

        {!isOnline && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            padding: '0.75rem', 
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <strong>Offline Mode:</strong> Aplikasi tetap bisa dibuka, tapi pengubah suara tidak aktif.
          </div>
        )}

        <div className="controls">
          {!isListening ? (
            <button 
              className="btn-primary" 
              onClick={startListening}
              disabled={!isOnline}
              style={{ opacity: !isOnline ? 0.5 : 1, cursor: !isOnline ? 'not-allowed' : 'pointer' }}
            >
              <Mic size={24} />
              Mulai
            </button>
          ) : (
            <button className="btn-danger" onClick={stopListening}>
              <MicOff size={24} />
              Berhenti
            </button>
          )}

          <button className="btn-secondary" onClick={clearTranscript} disabled={isListening}>
            <Trash2 size={24} />
            Hapus
          </button>
        </div>
      </main>
    </>
  );
}

export default App;
