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
  /(?:hey|hi|hello)\s*laby[,.\s]*/i,                    // 영어: hey laby
  /(?:헤이|하이|해이|에이|안녕|헤일|해일|회의)\s*(?:라비|래비|레비|레이비|라 비|래빗|레빗|래빗츠|래비츠|레비츠|라비츠|라빗츠)[,.\s]*/i,  // 한국어 호출어 결합형
  /(?:헤|해)\s*이\s*(?:라|래|레)\s*(?:비|빗)[,.\s]*/i,     // 띄어쓰기 변형
  /(?:라비|래비|레비|래빗|레빗|라비츠|래비츠)\s*(?:아|야)[,.\s]*/i,   // 호칭형 (야)
  /^(?:라비|래비|레비|laby|래빗|레빗|라비츠|래비츠|레비츠|라비츠|라빗츠)[,.\s]+/i, // 문장 시작점 단독 인식
];

function extractCommand(transcript: string): string | null {
  const normalized = transcript.trim();

  for (const pattern of WAKE_WORD_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // wake word 이후의 텍스트만 추출
      const afterWakeWord = normalized.slice(match.index! + match[0].length).trim();
      // 마지막 마침표 제거
      const cleaned = afterWakeWord.replace(/[.]$/, "").trim();
      console.log("[Speech] Wake word detected, command:", cleaned || "(none)");
      return cleaned || null;
    }
  }

  return null;
}

function hasWakeWord(transcript: string): boolean {
  return WAKE_WORD_PATTERNS.some(pattern => pattern.test(transcript.trim()));
}

// wake word가 포함된 경우, 명령어 부분만 추출 (interim용)
function extractInterimCommand(transcript: string): string | null {
  const normalized = transcript.trim();

  for (const pattern of WAKE_WORD_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return normalized.slice(match.index! + match[0].length).trim() || null;
    }
  }

  return null;
}

export type SpeechMode = "wake-word-only" | "command-listening";

export function useSpeech(options: UseSpeechOptions = {}) {
  const {
    onCommand,
    onWakeWord,
    wakeWord = "laby",
    language = "ko-KR",
  } = options;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [mode, setMode] = useState<SpeechMode>("wake-word-only");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const tokenRef = useRef<{ token: string; region: string } | null>(null);
  const tokenExpiryRef = useRef<number>(0);
  const shouldContinueRef = useRef<boolean>(false);
  const startListeningRef = useRef<(() => void) | null>(null);

  // 스마트 상호작용을 위한 Refs
  const modeRef = useRef<SpeechMode>("wake-word-only");
  const commandBufferRef = useRef<string>(""); 
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helper Functions ---

  const switchMode = useCallback((newMode: SpeechMode) => {
    console.log(`[Speech] Switching mode: ${modeRef.current} -> ${newMode}`);
    modeRef.current = newMode;
    setMode(newMode);

    // 모드 변경 시 타이머 초기화
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);

    if (newMode === "wake-word-only") {
      setInterimTranscript(""); // 대기 모드에선 중간 결과 숨김 (또는 "듣는 중..." 표시)
      commandBufferRef.current = "";
    } else {
      // Command 모드 진입: 10초 타임아웃 시작
      resetCommandTimeout();
    }
  }, []);

  const resetCommandTimeout = useCallback(() => {
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    // 10초 동안 아무 명령이 없으면 대기 모드로 복귀
    commandTimeoutRef.current = setTimeout(() => {
      console.log("[Speech] Command timeout (10s), reverting to wake-word-only");
      switchMode("wake-word-only");
    }, 10000);
  }, [switchMode]);

  const executeCommand = useCallback(() => {
    const cmd = commandBufferRef.current.trim();
    if (cmd) {
      console.log("[Speech] Auto-sending command:", cmd);
      onCommand?.(cmd);
      setTranscript(cmd); // UI에 최종 명령 표시
      
      // 전송 후 바로 버퍼 비우고 대기 모드로 복귀
      commandBufferRef.current = "";
      switchMode("wake-word-only");
    } else {
      console.log("[Speech] Buffer empty, nothing to send");
    }
  }, [onCommand, switchMode]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    // 3초 침묵 시 전송
    silenceTimerRef.current = setTimeout(() => {
      console.log("[Speech] Silence detected (3s), executing command...");
      executeCommand();
    }, 3000);
  }, [executeCommand]);


  // --- Core Logic ---

  const getToken = useCallback(async () => {
    const now = Date.now();
    if (tokenRef.current && tokenExpiryRef.current > now) {
      return tokenRef.current;
    }
    try {
      const tokenData = await fetchSpeechToken();
      tokenRef.current = tokenData;
      tokenExpiryRef.current = now + 9 * 60 * 1000;
      return tokenData;
    } catch (err) {
      console.error("Failed to fetch speech token:", err);
      throw err;
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;
    
    // 타이머 정리
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          recognizerRef.current?.close();
          recognizerRef.current = null;
          setStatus("idle");
          // 정지 시 모드도 초기화
          switchMode("wake-word-only");
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
  }, [switchMode]);

  const startListening = useCallback(async () => {
    if (recognizerRef.current) {
      shouldContinueRef.current = false;
      recognizerRef.current?.close();
      recognizerRef.current = null;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    shouldContinueRef.current = true;
    setStatus("processing");
    setError(null);
    switchMode("wake-word-only"); // 시작은 항사 대기 모드

    try {
      const tokenData = await getToken();
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const config = sdk.SpeechConfig.fromAuthorizationToken(
        tokenData.token,
        tokenData.region
      );
      config.speechRecognitionLanguage = language;
      config.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "300000");
      config.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "300000");

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      recognizerRef.current = recognizer;
      setTranscript("");
      setInterimTranscript("");
      setRawTranscript("");

      recognizer.recognizing = (_s, e) => {
        if (!e.result.text) return;
        
        const text = e.result.text;
        setRawTranscript(text);

        if (modeRef.current === "wake-word-only") {
          // --- Wake Word Mode ---
          if (hasWakeWord(text)) {
             console.log("[Speech] Wake word detected!");
             onWakeWord?.();
             
             // 바로 Command Mode로 전환
             switchMode("command-listening");
             
             // Wake Word 뒤에 바로 이어진 명령어가 있는지 확인
             const commandPart = extractCommand(text);
             if (commandPart) {
                // Buffer에는 쓰지 않고 UI만 업데이트 (Recognized에서 처리)
                setInterimTranscript(commandPart);
             } else {
                setInterimTranscript("");
             }
             
             // 타이머 시작 (명령어 입력 대기)
             resetCommandTimeout();
          }
        } else {
          // --- Command Listening Mode ---
          // 침묵 타이머 리셋 (말하고 있으므로)
          resetSilenceTimer();
          // 10초 타임아웃 리셋 (활동 중이므로)
          resetCommandTimeout();

          setInterimTranscript(text);
        }
      };

      recognizer.recognized = (_s, e) => {
        const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.result.reason === speechSdk.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          console.log("[Speech] Recognized:", text);

          if (modeRef.current === "wake-word-only") {
            // 인식 완료 시점에도 Wake Word 체크 (짧게 말하고 끊었을 경우)
            if (hasWakeWord(text)) {
               onWakeWord?.();
               switchMode("command-listening");
               
               const commandPart = extractCommand(text);
               if (commandPart) {
                 commandBufferRef.current += commandPart + " ";
                 setInterimTranscript(commandPart);
                 // 이미 말이 끝났으므로(Recognized), 여기서 바로 침묵 타이머가 돌기 시작
                 resetSilenceTimer();
                 resetCommandTimeout();
               } else {
                 // Wake Word만 말함
                 resetCommandTimeout();
               }
            }
          } else {
            // --- Command Listening Mode ---
            let contentToAdd = text;
            // 만약 이 문장에 Wake Word가 포함되어 있다면 제거 (Trigger Sentence일 가능성 높음)
            if (hasWakeWord(text)) {
                 const extracted = extractCommand(text);
                 contentToAdd = extracted || "";
            }
            
            if (contentToAdd) {
                commandBufferRef.current += contentToAdd + " ";
                console.log("[Speech] Buffer updated:", commandBufferRef.current);
            }
            setInterimTranscript(""); // 중간 결과 클리어

            // 말이 끝났으므로 침묵 타이머 리셋 (이제부터 침묵 시작)
            resetSilenceTimer();
            resetCommandTimeout();
          }
        }
      };

      recognizer.canceled = (_s, e) => {
        const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.reason === speechSdk.CancellationReason.Error) {
          console.log("[Speech] Canceled with error:", e.errorDetails);
          setError(`Recognition error: ${e.errorDetails}`);
          setStatus("error");
          shouldContinueRef.current = false;
        } else {
          if (shouldContinueRef.current) {
             // 재시작 로직
             startListeningRef.current?.();
             return;
          }
        }
        stopListening();
      };

      recognizer.sessionStopped = () => {
        if (shouldContinueRef.current) {
           startListeningRef.current?.();
           return;
        }
        stopListening();
      };

      recognizer.startContinuousRecognitionAsync(
        () => setStatus("listening"),
        (err) => {
          console.error("Start error:", err);
          setError("Failed to start");
          setStatus("error");
        }
      );

    } catch (err) {
      console.error(err);
      setError("Service unavailable");
      setStatus("error");
      setIsSupported(false);
    }
  }, [getToken, language, onCommand, onWakeWord, stopListening, switchMode, executeCommand, resetCommandTimeout, resetSilenceTimer]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else if (status !== "processing") {
      startListening();
    }
  }, [status, startListening, stopListening]);

  const recognizeOnce = useCallback(async (): Promise<string> => {
    if (recognizerRef.current) {
      stopListening();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setStatus("processing");
    setError(null);

    return new Promise(async (resolve, reject) => {
      try {
        const tokenData = await getToken();
        const sdk = await import("microsoft-cognitiveservices-speech-sdk");
        const config = sdk.SpeechConfig.fromAuthorizationToken(tokenData.token, tokenData.region);
        config.speechRecognitionLanguage = language;
        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new sdk.SpeechRecognizer(config, audioConfig);
        setStatus("listening");
        
        recognizer.recognizeOnceAsync(
          (result) => {
            recognizer.close();
            setStatus("idle");
            if (result.reason === sdk.ResultReason.RecognizedSpeech) resolve(result.text);
            else if (result.reason === sdk.ResultReason.NoMatch) resolve("");
            else reject(new Error("Canceled or Error"));
          },
          (err) => {
            recognizer.close();
            setStatus("error");
            reject(err);
          }
        );
      } catch (err) {
        setStatus("error");
        reject(err);
      }
    });
  }, [getToken, language, stopListening]);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, []);

  return {
    status,
    mode, // Exported Mode
    isListening: status === "listening",
    transcript,
    interimTranscript,
    rawTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    recognizeOnce,
  };
}
