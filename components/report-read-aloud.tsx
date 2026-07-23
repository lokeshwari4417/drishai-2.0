"use client";

import VoiceAssistant from "@/components/voice-assistant";

export default function ReportReadAloud({ text }: { text: string }) {
  return <VoiceAssistant readText={text} />;
}
