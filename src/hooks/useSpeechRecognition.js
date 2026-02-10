import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Browser tidak mendukung Speech Recognition.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Default ke Bahasa Indonesia

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let finalTrans = '';
            let interimTrans = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTrans += event.results[i][0].transcript;
                } else {
                    interimTrans += event.results[i][0].transcript;
                }
            }

            if (finalTrans) {
                setTranscript((prev) => prev + ' ' + finalTrans);
            }
            setInterimTranscript(interimTrans);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setError('Akses mikrofon ditolak.');
                setIsListening(false);
            } else {
                // Ignore other errors for now or handle them
            }
        };

        recognition.onend = () => {
            // Auto-restart if it was supposed to be listening (for continuous effect)
            // But for now, let's just update state. 
            // User might want to toggle manually.
            // If we want "always on", we need to restart here if isListening was meant to be true.
            // Getting strict "isListening" state tracking is tricky with auto-restart.
            // We'll let UI control start/stop for MVP clarity.
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const manualStop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Start error", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        // Actually stop recognition
        manualStop();
    }, [manualStop]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        clearTranscript,
        error
    };
};
