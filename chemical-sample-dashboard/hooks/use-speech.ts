"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSpeechToken } from "@/lib/data/speech";

type SpeechRecognizer = import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer;
type SpeechConfig = import("microsoft-cognitiveservices-speech-sdk").SpeechConfig;

export type SpeechStatus = "idle" | "listening" | "processing" | "error";

export type UseSpeechOptions = {
  onCommand?: (command: string) => void;
  onWakeWord?: () => void;
  wakeWord?: string;
  language?: string;
};

// 다국어 wake word 패턴 (영어/한국어) - 띄어쓰기 유연하게 처리
const WAKE_WORD_PATTERNS = [
  /^(?:hey|hi|hello)\s*laby[,.\s]*/i,                    // 영어: hey laby
  /^(?:헤이|하이|해이|에이|안녕)\s*(?:라비|래비|레이비|라 비)[,.\s]*/i,  // 한국어: 헤이 라비
  /^(?:헤|해)\s*이\s*(?:라|래)\s*비[,.\s]*/i,              // 띄어쓰기 변형: 헤 이 라 비
];

function extractCommand(transcript: string): string | null {
  const normalized = transcript.trim();

  for (const pattern of WAKE_WORD_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      const command = normalized.slice(match[0].length).trim();
      // 마지막 마침표 제거
      const cleaned = command.replace(/[.]$/, "").trim();
      console.log("[Speech] Wake word detected, command:", cleaned || "(none)");
      return cleaned || null;
    }
  }

  console.log("[Speech] No wake word match for:", normalized);
  return null;
}

function hasWakeWord(transcript: string): boolean {
  return WAKE_WORD_PATTERNS.some(pattern => pattern.test(transcript.trim()));
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
  const tokenRef = useRef<{ token: string; region: string } | null>(null);
  const tokenExpiryRef = useRef<number>(0);

  const getToken = useCallback(async () => {
    const now = Date.now();
    // 토큰이 있고 만료 9분 전이면 재사용 (토큰 유효시간 10분)
    if (tokenRef.current && tokenExpiryRef.current > now) {
      return tokenRef.current;
    }

    try {
      const tokenData = await fetchSpeechToken();
      tokenRef.current = tokenData;
      tokenExpiryRef.current = now + 9 * 60 * 1000; // 9분 후 갱신
      return tokenData;
    } catch (err) {
      console.error("Failed to fetch speech token:", err);
      throw err;
    }
  }, []);

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
    if (recognizerRef.current) {
      stopListening();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setStatus("processing");
    setError(null);

    try {
      // 백엔드에서 토큰 가져오기
      const tokenData = await getToken();

      const sdk = await import("microsoft-cognitiveservices-speech-sdk");

      // 토큰으로 SpeechConfig 생성
      const config = sdk.SpeechConfig.fromAuthorizationToken(
        tokenData.token,
        tokenData.region
      );
      config.speechRecognitionLanguage = language;
      config.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "15000"
      );
      config.setProperty(
        sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "3000"
      );

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      recognizerRef.current = recognizer;
      setTranscript("");
      setInterimTranscript("");

      recognizer.recognizing = (_s, e) => {
        if (e.result.text) {
          setInterimTranscript(e.result.text);
        }
      };

      recognizer.recognized = (_s, e) => {
        const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.result.reason === speechSdk.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          console.log("[Speech] Recognized:", text);
          setTranscript(text);
          setInterimTranscript("");

          const command = extractCommand(text);
          if (command) {
            console.log("[Speech] Sending command:", command);
            onWakeWord?.();
            onCommand?.(command);
          } else if (hasWakeWord(text)) {
            // wake word만 말한 경우 (명령어 없음)
            console.log("[Speech] Wake word only, no command");
            onWakeWord?.();
          }
        }
      };

      recognizer.canceled = (_s, e) => {
        const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.reason === speechSdk.CancellationReason.Error) {
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
      setError("Speech service unavailable");
      setStatus("error");
      setIsSupported(false);
    }
  }, [getToken, language, onCommand, onWakeWord, stopListening, wakeWord]);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else if (status !== "processing") {
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
