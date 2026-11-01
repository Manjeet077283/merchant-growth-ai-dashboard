import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers that support it
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export type VoiceLanguage = 'en-US' | 'hi-IN';
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface UseVoiceAssistantReturn {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isPermissionDenied: boolean;
  voiceState: VoiceState;
  language: VoiceLanguage;
  voiceError: string | null;
  availableVoices: SpeechSynthesisVoice[];
  setLanguage: (lang: VoiceLanguage) => void;
  setVoiceState: (state: VoiceState) => void;
  toggleMute: () => void;
  startListening: (onInterimResult?: (text: string) => void, onFinalResult?: (text: string) => void) => void;
  stopListening: () => void;
  speak: (text: string) => void;
  replay: (text: string) => void;
  stopSpeaking: () => void;
  clearError: () => void;
}

export const useVoiceAssistant = (): UseVoiceAssistantReturn => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [language, setLanguage] = useState<VoiceLanguage>('en-US');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const safetyTimerRef = useRef<any>(null);

  // Initialize Speech capabilities and cache system voices
  useEffect(() => {
    const hasSpeechRecognition =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    
    setIsSupported(Boolean(hasSpeechRecognition));

    // Check microphone permission status proactively if available
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setIsPermissionDenied(true);
            setVoiceError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              setIsPermissionDenied(false);
              setVoiceError(null);
            } else if (permissionStatus.state === 'denied') {
              setIsPermissionDenied(true);
              setVoiceError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
            }
          };
        })
        .catch(() => {
          // Some browsers don't support microphone query; silently ignore
        });
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      // Populate voices immediately and listen for dynamic load event (Chromium requirement)
      const loadVoices = () => {
        if (synthRef.current) {
          const voices = synthRef.current.getVoices();
          if (voices && voices.length > 0) {
            availableVoicesRef.current = voices;
            setAvailableVoices(voices);
          }
        }
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setVoiceState('idle');
      }
      return next;
    });
  }, []);

  const clearError = useCallback(() => {
    setVoiceError(null);
    setVoiceState((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  const startListening = useCallback(
    (onInterimResult?: (text: string) => void, onFinalResult?: (text: string) => void) => {
      setVoiceError(null);

      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        const errorMsg = 'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.';
        setVoiceError(errorMsg);
        setVoiceState('error');
        return;
      }

      // Stop any existing speech recognition session to prevent InvalidStateError
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      // Stop ongoing speech synthesis
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }

      try {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = false; // Capture a single coherent query
        recognition.interimResults = true; // Stream live transcript to input field
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setIsPermissionDenied(false);
          setVoiceState('listening');
          setVoiceError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Accumulate all items in results list to ensure no words vanish
          for (let i = 0; i < event.results.length; ++i) {
            const resultItem = event.results[i];
            if (resultItem.isFinal) {
              finalTranscript += resultItem[0].transcript;
            } else {
              interimTranscript += resultItem[0].transcript;
            }
          }

          const combined = (finalTranscript + ' ' + interimTranscript).trim();

          if (interimTranscript && onInterimResult) {
            onInterimResult(combined);
          }
          if (finalTranscript && onFinalResult) {
            onFinalResult(finalTranscript.trim());
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error event:', event.error);
          setIsListening(false);
          setVoiceState('error');

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsPermissionDenied(true);
            setVoiceError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          } else if (event.error === 'no-speech') {
            setVoiceError('No speech detected. Press the microphone and speak clearly.');
          } else if (event.error === 'audio-capture') {
            setVoiceError('No microphone detected. Please plug in or enable your microphone.');
          } else if (event.error === 'network') {
            setVoiceError('Speech recognition network error. Please verify your internet connection.');
          } else {
            setVoiceError(`Voice recognition: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setIsListening(false);
        setVoiceState('error');
        setVoiceError(err.message || 'Unable to start speech recognition.');
      }
    },
    [language]
  );

  // Clean and format text for natural, human-sounding SpeechSynthesis
  const cleanMarkdownForSpeech = (text: string): string => {
    return text
      .replace(/###?\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italics
      .replace(/`([^`]+)`/g, '$1') // Remove code backticks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links, keep text
      .replace(/[-*•]\s+/g, '') // Remove bullet points
      .replace(/&bull;/g, '')
      .replace(/\n+/g, '. ') // Turn newlines into natural pauses
      .trim();
  };

  const speak = useCallback(
    (rawText: string) => {
      if (isMuted || !synthRef.current || !rawText.trim()) {
        setIsSpeaking(false);
        setVoiceState('idle');
        return;
      }

      try {
        synthRef.current.cancel();
        if (typeof synthRef.current.resume === 'function') {
          synthRef.current.resume();
        }

        const speechText = cleanMarkdownForSpeech(rawText);
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Check if text is predominantly Hindi or English and select best matched voice
        const isHindiText = anyHindiChars(rawText) || language === 'hi-IN';
        const targetLang = isHindiText ? 'hi-IN' : 'en-US';
        utterance.lang = targetLang;

        const voices = availableVoicesRef.current.length > 0
          ? availableVoicesRef.current
          : synthRef.current.getVoices();

        if (voices.length > 0) {
          let matchingVoice: SpeechSynthesisVoice | undefined;

          if (isHindiText) {
            matchingVoice = voices.find(
              (v) =>
                v.lang.toLowerCase().replace('_', '-').startsWith('hi') ||
                v.name.toLowerCase().includes('hindi') ||
                v.name.includes('हिन्दी') ||
                v.name.toLowerCase().includes('kalpana') ||
                v.name.toLowerCase().includes('hemant') ||
                v.name.toLowerCase().includes('lekha')
            );
          } else {
            // Find quality English voice (Google, Natural, or en-US)
            matchingVoice =
              voices.find((v) => v.lang === 'en-US' && (v.name.includes('Natural') || v.name.includes('Google'))) ||
              voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('en'));
          }

          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
        }

        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
        }

        // Safety watchdog: clear speaking state after 15s max if onend doesn't fire
        safetyTimerRef.current = setTimeout(() => {
          setIsSpeaking(false);
          setVoiceState('idle');
        }, 15000);

        utterance.onstart = () => {
          setIsSpeaking(true);
          setVoiceState('speaking');
        };

        utterance.onend = () => {
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          setIsSpeaking(false);
          setVoiceState('idle');
        };

        utterance.onerror = (e) => {
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          console.warn('Speech synthesis playback error:', e);
          setIsSpeaking(false);
          setVoiceState('idle');
        };

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis invocation failure:', err);
        setIsSpeaking(false);
        setVoiceState('idle');
      }
    },
    [isMuted, language]
  );

  const replay = useCallback(
    (text: string) => {
      speak(text);
    },
    [speak]
  );

  const stopSpeaking = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setVoiceState('idle');
    }
  }, []);

  return {
    isSupported,
    isListening,
    isSpeaking,
    isMuted,
    isPermissionDenied,
    voiceState,
    language,
    voiceError,
    availableVoices,
    setLanguage,
    setVoiceState,
    toggleMute,
    startListening,
    stopListening,
    speak,
    replay,
    stopSpeaking,
    clearError,
  };
};

// Helper: detect Hindi Devanagari Unicode characters
function anyHindiChars(str: string): boolean {
  return /[\u0900-\u097F]/.test(str);
}
