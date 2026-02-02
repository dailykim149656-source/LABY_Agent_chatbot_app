"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognizer = import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer;
type SpeechConfig = import("microsoft-cognitiveservices-speech-sdk").SpeechConfig;
type AudioConfig = import("microsoft-cognitiveservices-speech-sdk").AudioConfig;

export type SpeechStatus = "idle" | "listening" | "processing" | "error";

export type UseSpeechOptions = {
  onCommand?: (command: string) => void;
  onWakeWord?: () => void;
  wakeWord?: string;
  language?: string;
};

const WAKE_WORD_PATTERN = /^(?:hey|hi|hello)?\s*laby[,.]?\s*/i;

function extractCommand(transcript: string, wakeWord: string): string | null {
  const pattern = new RegExp(`^(?:hey|hi|hello)?\\s*${wakeWord}[,.]?\\s*(.*)`, "i");
  const match = transcript.match(pattern);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }
  return null;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const {
    onCommand,
    onWakeWord,
    wakeWord = "laby",
    language = "ko-KR",
  } = options;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const speechConfigRef = useRef<SpeechConfig | null>(null);

  useEffect(() => {
    const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      setIsSupported(false);
      setError("Azure Speech credentials not configured");
      return;
    }

    let mounted = true;

    const initSpeech = async () => {
      try {
        const sdk = await import("microsoft-cognitiveservices-speech-sdk");
        if (!mounted) return;

        const config = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        config.speechRecognitionLanguage = language;
        config.setProperty(
          sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
          "15000"
        );
        config.setProperty(
          sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
          "3000"
        );

        speechConfigRef.current = config;
        setIsSupported(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setIsSupported(false);
        setError("Failed to initialize speech SDK");
        console.error("Speech SDK init error:", err);
      }
    };

    initSpeech();

    return () => {
      mounted = false;
    };
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          recognizerRef.current?.close();
          recognizerRef.current = null;
          setStatus("idle");
        },
        (err) => {
          console.error("Stop recognition error:", err);
          recognizerRef.current?.close();
          recognizerRef.current = null;
          setStatus("idle");
        }
      );
    } else {
      setStatus("idle");
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!speechConfigRef.current) {
      setError("Speech not initialized");
      return;
    }

    if (recognizerRef.current) {
      stopListening();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(
        speechConfigRef.current,
        audioConfig
      );

      recognizerRef.current = recognizer;
      setStatus("listening");
      setTranscript("");
      setInterimTranscript("");
      setError(null);

      recognizer.recognizing = (_s, e) => {
        if (e.result.text) {
          setInterimTranscript(e.result.text);
        }
      };

      recognizer.recognized = (_s, e) => {
        const sdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          setTranscript(text);
          setInterimTranscript("");

          const command = extractCommand(text, wakeWord);
          if (command) {
            onWakeWord?.();
            onCommand?.(command);
          } else if (WAKE_WORD_PATTERN.test(text)) {
            onWakeWord?.();
          }
        }
      };

      recognizer.canceled = (_s, e) => {
        const sdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.reason === sdk.CancellationReason.Error) {
          setError(`Recognition error: ${e.errorDetails}`);
          setStatus("error");
        }
        stopListening();
      };

      recognizer.sessionStopped = () => {
        stopListening();
      };

      recognizer.startContinuousRecognitionAsync(
        () => {
          setStatus("listening");
        },
        (err) => {
          console.error("Start recognition error:", err);
          setError("Failed to start recognition");
          setStatus("error");
        }
      );
    } catch (err) {
      console.error("Recognition setup error:", err);
      setError("Failed to setup recognition");
      setStatus("error");
    }
  }, [onCommand, onWakeWord, stopListening, wakeWord]);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
    };
  }, []);

  return {
    status,
    isListening: status === "listening",
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
