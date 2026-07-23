"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Volume2, Square } from "lucide-react";

/**
 * Voice Assistant
 * ----------------
 * Uses the browser's native Web Speech API — no external service or API
 * key needed. `speak()` reads a passage aloud (e.g. a report summary).
 * The mic button does speech-to-text and forwards the transcript to
 * `onCommand`, so pages can wire it up to navigation or the chatbot.
 */

export default function VoiceAssistant({
  readText,
  onCommand,
}: {
  /** Text to read aloud when the speaker button is pressed */
  readText?: string;
  /** Called with the recognized transcript after the mic finishes listening */
  onCommand?: (transcript: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onCommand?.(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  function speak() {
    if (!readText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(readText);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {readText && (
        <button
          type="button"
          onClick={speaking ? stopSpeaking : speak}
          className="btn-secondary !px-3 !py-1.5 text-xs"
          title={speaking ? "Stop reading" : "Read aloud"}
        >
          {speaking ? <Square size={14} /> : <Volume2 size={14} />}
          <span className="ml-1.5">{speaking ? "Stop" : "Read aloud"}</span>
        </button>
      )}
      {onCommand && (
        <button
          type="button"
          onClick={toggleListening}
          className={`btn-secondary !px-3 !py-1.5 text-xs ${listening ? "!border-brand-500 !bg-brand-50 !text-brand-700" : ""}`}
          title="Voice command"
        >
          <Mic size={14} />
          <span className="ml-1.5">{listening ? "Listening…" : "Voice"}</span>
        </button>
      )}
    </div>
  );
}
