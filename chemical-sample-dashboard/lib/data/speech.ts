import { fetchJson } from "@/lib/api";

export type SpeechTokenResponse = {
  token: string;
  region: string;
};

export async function fetchSpeechToken(): Promise<SpeechTokenResponse> {
  return fetchJson<SpeechTokenResponse>("/api/speech/token");
}
