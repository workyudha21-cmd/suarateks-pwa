import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    // Ref to store the transcript from previous sessions
    const transcriptBaseRef = useRef('');

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Browser tidak mendukung Speech Recognition.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Default to Indonesian

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let currentSessionFinal = '';
            let currentSessionInterim = '';

            // Iterate through ALL results of the current session
            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const prefix = currentSessionFinal ? '\n\n' : '';
                    currentSessionFinal += prefix + event.results[i][0].transcript;
                } else {
                    currentSessionInterim += event.results[i][0].transcript;
                }
            }

            // Combine base transcript with current session's final result
            // Deduplication Logic:
            const base = transcriptBaseRef.current || '';
            const cleanBase = base.trim();
            const cleanCurrent = currentSessionFinal.trim();

            let finalTranscript = '';

            // Check if currLast (current session text) starts with base.
            // If so, the engine kept history, so we use current directly.
            if (cleanBase && cleanCurrent.startsWith(cleanBase)) {
                finalTranscript = currentSessionFinal;
            } else {
                // Engine cleared history, standard append
                const separator = (base && currentSessionFinal) ? '\n\n' : '';
                finalTranscript = base + separator + currentSessionFinal;
            }

            setTranscript(finalTranscript);
            setInterimTranscript(currentSessionInterim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setError('Akses mikrofon ditolak.');
                setIsListening(false);
            } else {
                // Ignore other errors
            }
        };

        recognition.onend = () => {
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
            // Do NOT set isListening(false) here. 
            // Wait for 'onend' to fire to ensure the engine has fully stopped.
            // This prevents race conditions where user can click Start again too early.
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                // Snapshot current transcript as base for the new session
                transcriptBaseRef.current = transcript;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                // Handle case where browser thinks it's already started but React state disagrees
                if (e.name === 'InvalidStateError' || e.message.includes('already started')) {
                    console.warn("Speech recognition was already started. Syncing state.");
                    setIsListening(true);
                } else {
                    console.error("Start error", e);
                }
            }
        }
    }, [isListening, transcript]);

    const stopListening = useCallback(() => {
        manualStop();
    }, [manualStop]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        transcriptBaseRef.current = '';
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
