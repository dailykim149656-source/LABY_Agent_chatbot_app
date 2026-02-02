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
  /(?:헤이|하이|해이|에이|안녕)\s*(?:라비|래비|레이비|라 비)[,.\s]*/i,  // 한국어: 헤이 라비
  /(?:헤|해)\s*이\s*(?:라|래)\s*비[,.\s]*/i,              // 띄어쓰기 변형: 헤 이 라 비
  /(?:라비|래비)야[,.\s]*/i,                             // 라비야, 래비야
  /^(?:라비|래비|laby)[,.\s]+/i,                         // 라비, 래비, laby (문장 시작)
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
  const [rawTranscript, setRawTranscript] = useState(""); // 실제로 들은 전체 텍스트
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const tokenRef = useRef<{ token: string; region: string } | null>(null);
  const tokenExpiryRef = useRef<number>(0);
  const shouldContinueRef = useRef<boolean>(false); // 연속 듣기 모드 플래그
  const startListeningRef = useRef<(() => void) | null>(null); // 재시작용 ref

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
    shouldContinueRef.current = false; // 연속 듣기 중지
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
      shouldContinueRef.current = false;
      recognizerRef.current?.close();
      recognizerRef.current = null;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    shouldContinueRef.current = true; // 연속 듣기 활성화
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
      // 연속 듣기를 위해 타임아웃 늘림 (5분)
      config.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "300000"
      );
      config.setProperty(
        sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "300000"
      );

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      recognizerRef.current = recognizer;
      setTranscript("");
      setInterimTranscript("");
      setRawTranscript("");

      recognizer.recognizing = (_s, e) => {
        if (e.result.text) {
          // 실제로 들은 텍스트 항상 표시
          setRawTranscript(e.result.text);

          // wake word가 포함된 경우에만 명령어 부분을 표시
          if (hasWakeWord(e.result.text)) {
            const interimCmd = extractInterimCommand(e.result.text);
            setInterimTranscript(interimCmd || "...");
          } else {
            setInterimTranscript("");
          }
        }
      };

      recognizer.recognized = (_s, e) => {
        const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
        if (e.result.reason === speechSdk.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          console.log("[Speech] Recognized:", text);
          setRawTranscript(text); // 최종 인식 결과 표시

          // wake word가 없으면 무시 (rawTranscript는 잠시 표시 후 지움)
          if (!hasWakeWord(text)) {
            console.log("[Speech] Ignoring - no wake word");
            setInterimTranscript("");
            // 2초 후 rawTranscript 지움
            setTimeout(() => setRawTranscript(""), 2000);
            return;
          }

          const command = extractCommand(text);
          if (command) {
            console.log("[Speech] Sending command:", command);
            setTranscript(command);  // 명령어만 표시
            setInterimTranscript("");
            onWakeWord?.();
            onCommand?.(command);
            // 명령 전송 후 rawTranscript 지움
            setTimeout(() => setRawTranscript(""), 1000);
          } else {
            // wake word만 말한 경우 (명령어 없음)
            console.log("[Speech] Wake word only, waiting for command...");
            setTranscript("");
            setInterimTranscript("명령을 말해주세요...");
            onWakeWord?.();
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
          // 연속 듣기 모드면 다시 시작
          console.log("[Speech] Session canceled, restarting...");
          if (shouldContinueRef.current) {
            recognizerRef.current?.close();
            recognizerRef.current = null;
            setTimeout(() => {
              if (shouldContinueRef.current) {
                startListeningRef.current?.();
              }
            }, 500);
            return;
          }
        }
        stopListening();
      };

      recognizer.sessionStopped = () => {
        console.log("[Speech] Session stopped");
        // 연속 듣기 모드면 다시 시작
        if (shouldContinueRef.current) {
          console.log("[Speech] Restarting for continuous listening...");
          recognizerRef.current?.close();
          recognizerRef.current = null;
          setTimeout(() => {
            if (shouldContinueRef.current) {
              startListeningRef.current?.();
            }
          }, 500);
          return;
        }
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

  // startListening ref 업데이트 (콜백에서 재시작할 때 사용)
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

  /**
   * 단일 문장 인식 (질문용)
   * - 한 문장을 인식하고 자동 종료
   * - 결과 텍스트를 Promise로 반환
   */
  const recognizeOnce = useCallback(async (): Promise<string> => {
    // 기존 리스닝 중단
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
        const config = sdk.SpeechConfig.fromAuthorizationToken(
          tokenData.token,
          tokenData.region
        );
        config.speechRecognitionLanguage = language;

        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

        // 단일 인식 모드 설정
        setStatus("listening");
        
        recognizer.recognizeOnceAsync(
          (result) => {
            recognizer.close();
            setStatus("idle");
            
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              console.log("[Speech] RecognizeOnce result:", result.text);
              resolve(result.text);
            } else if (result.reason === sdk.ResultReason.NoMatch) {
              console.log("[Speech] RecognizeOnce no match");
              resolve(""); // 매칭 안됨은 빈 문자열로 처리 (에러 아님)
            } else if (result.reason === sdk.ResultReason.Canceled) {
              const cancellation = sdk.CancellationDetails.fromResult(result);
              if (cancellation.reason === sdk.CancellationReason.Error) {
                reject(new Error(cancellation.errorDetails));
              } else {
                reject(new Error("Canceled"));
              }
            }
          },
          (err) => {
            recognizer.close();
            setStatus("error");
            setError(err);
            reject(new Error(err));
          }
        );
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to start recognition");
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
    };
  }, []);

  return {
    status,
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
