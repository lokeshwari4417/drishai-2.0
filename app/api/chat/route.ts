import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Chatbot Module
 * ---------------
 * Ships as a rule-based FAQ responder so the app works out of the box with
 * no API keys. To upgrade to a real LLM-backed assistant, swap the body of
 * `answer()` for a call to the Anthropic API (POST
 * https://api.anthropic.com/v1/messages with your ANTHROPIC_API_KEY set as
 * a server-side env var — never expose it to the client).
 */

const FAQ: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/dr stage|severity|grade|0.*4|stages/i],
    answer:
      "DrishAI grades diabetic retinopathy on a 5-point scale: 0 = No DR, 1 = Mild, 2 = Moderate, 3 = Severe, 4 = Proliferative DR. Each report also shows a confidence score and a recommended next step.",
  },
  {
    patterns: [/upload|scan|take.*photo|capture/i],
    answer:
      "To screen a patient: open 'Take/upload a scan', select or capture a retinal fundus image, and the AI model will analyze it on-device. You'll get a severity grade and recommendation within a few seconds.",
  },
  {
    patterns: [/accura|reliab|trust/i],
    answer:
      "DrishAI is a screening aid, not a diagnostic device — it's meant to flag patients who need a closer look from an eye care professional. Always confirm severe or proliferative results with an ophthalmologist.",
  },
  {
    patterns: [/privacy|data|store|upload.*server/i],
    answer:
      "Image analysis runs on-device in your browser using TensorFlow.js — your fundus image isn't sent to a server for grading. It's only stored if you save the screening to a patient's record.",
  },
  {
    patterns: [/doctor|refer|send.*report/i],
    answer:
      "NGOs and organizations can route a patient's screening to a specific doctor for review from the report screen — look for 'Send to doctor'.",
  },
  {
    patterns: [/hi|hello|hey/i],
    answer: "Hi! I'm the DrishAI assistant. Ask me about screening steps, DR stages, or how your data is handled.",
  },
];

function answer(message: string): string {
  const hit = FAQ.find((f) => f.patterns.some((p) => p.test(message)));
  if (hit) return hit.answer;
  return "I'm not sure about that yet — I can help with screening steps, DR severity stages, data privacy, or routing reports to a doctor. Could you rephrase your question around one of those?";
}

const bodySchema = z.object({ message: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  return NextResponse.json({ reply: answer(parsed.data.message) });
}
