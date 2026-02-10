import { useState, useEffect } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import './index.css';

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
              Tekan tombol mikrofon dan mulai berbicara...
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--error-color)', textAlign: 'center', marginBottom: '1rem' }}>
            Error: {error}
          </div>
        )}

        <div className="controls">
          {!isListening ? (
            <button className="btn-primary" onClick={startListening}>
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
