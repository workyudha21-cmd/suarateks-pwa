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

            const lowerBase = cleanBase.toLowerCase();
            const lowerCurrent = cleanCurrent.toLowerCase();

            let finalTranscript = '';

            // Check 1: Full History Match (Case Insensitive)
            if (cleanBase && lowerCurrent.startsWith(lowerBase)) {
                finalTranscript = currentSessionFinal;
            }
            // Check 2: Tail Overlap Match (Case Insensitive)
            else {
                const lastBaseSegment = cleanBase.split('\n\n').pop()?.trim();
                const lowerLastSegment = lastBaseSegment?.toLowerCase();

                if (lowerLastSegment && lowerCurrent.startsWith(lowerLastSegment)) {
                    // The last segment of base is repeated at the start of current (ignoring case).
                    // We find where that segment matches in the *original* base string to preserver casing if needed,
                    // but for simplicity and safety, we just slice based on length of the match.

                    // Find index of the last segment in the base
                    const lastIndex = cleanBase.lastIndexOf(lastBaseSegment);

                    // Prefix is everything before that last segment
                    const basePrefix = cleanBase.substring(0, lastIndex).trim();
                    const separator = basePrefix ? '\n\n' : '';

                    // We use the NEW content (currentSessionFinal) as the authority for the overlap part
                    finalTranscript = basePrefix + separator + currentSessionFinal;
                } else {
                    // No overlap detected. Standard append.
                    const separator = (base && currentSessionFinal) ? '\n\n' : '';
                    finalTranscript = base + separator + currentSessionFinal;
                }
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
