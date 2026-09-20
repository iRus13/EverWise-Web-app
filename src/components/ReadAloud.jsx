import { useCallback, useEffect, useRef, useState } from "react";
import { SpeakerIcon, StopIcon } from "./Icons";
import { apiEndpoint } from "../utils/apiEndpoint";

const READ_ALOUD_ENDPOINT = apiEndpoint("/api/read-aloud");
const AUDIO_PROFILE_VERSION = "elevenlabs-bill-v3";
const audioCache = new Map();

async function getAudioBlob(text, signal) {
  const cacheKey = `${AUDIO_PROFILE_VERSION}:${text}`;
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey);

  const request = fetch(READ_ALOUD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error("ElevenLabs audio was unavailable");
    return response.blob();
  });

  try {
    const blob = await request;
    if (!signal.aborted) audioCache.set(cacheKey, blob);
    if (audioCache.size > 20) {
      audioCache.delete(audioCache.keys().next().value);
    }
    return blob;
  } catch (error) {
    audioCache.delete(cacheKey);
    throw error;
  }
}

export default function ReadAloud({ text, label = "Read aloud" }) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const utteranceRef = useRef(null);

  const releasePlayback = useCallback(() => {
    // Invalidate ownership before cancellation: stopping an audio source can
    // itself enqueue callbacks, including after another screen starts speech.
    const controller = abortRef.current;
    const audio = audioRef.current;
    abortRef.current = null;
    audioRef.current = null;
    utteranceRef.current = null;
    controller?.abort();
    audio?.pause();
    if (audio?.src) URL.revokeObjectURL(audio.src);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    setSpeaking(false);
    setLoading(false);
    return releasePlayback;
  }, [text, releasePlayback]);

  const stop = () => {
    releasePlayback();
    setLoading(false);
    setSpeaking(false);
  };

  const speakWithDeviceVoice = (speakText) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const finish = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const speak = async () => {
    const speakText = (text ?? "").toString().trim();
    if (!speakText) return;

    stop();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 8_000);

    try {
      const blob = await getAudioBlob(speakText, controller.signal);
      if (controller.signal.aborted || abortRef.current !== controller) return;
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { if (audioRef.current === audio) stop(); };
      audio.onerror = () => {
        if (abortRef.current !== controller || controller.signal.aborted) return;
        stop();
        speakWithDeviceVoice(speakText);
      };

      setLoading(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      if ((controller.signal.aborted && !timedOut) || abortRef.current !== controller) return;
      stop();
      speakWithDeviceVoice(speakText);
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <button
      type="button"
      onClick={speaking || loading ? stop : speak}
      aria-pressed={speaking}
      aria-busy={loading}
      className={`inline-flex items-center gap-3 rounded-full border-2 px-5 py-3 text-lg font-semibold transition-colors ${
        speaking || loading
          ? "border-clay bg-clay text-cream-card"
          : "border-clay/40 bg-cream-card text-clay hover:bg-clay/10"
      }`}
    >
      {speaking || loading ? <StopIcon /> : <SpeakerIcon />}
      {loading ? "Starting…" : speaking ? "Stop" : label}
    </button>
  );
}
