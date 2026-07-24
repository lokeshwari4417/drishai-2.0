import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Chatbot Module
 * ---------------
 * Backed by the real Anthropic API (Claude) so it can hold an actual
 * conversation, not just match keywords. Falls back to a small rule-based
 * FAQ responder automatically if ANTHROPIC_API_KEY isn't set — so the app
 * still works before you finish setting up billing.
 *
 * SETUP: add ANTHROPIC_API_KEY=sk-ant-... to your .env file (server-side
 * only — never exposed to the browser) and restart `npm run dev`.
 */

const SYSTEM_PROMPT = `You are the in-app assistant for DrishAI, a web app for AI-powered diabetic retinopathy (DR) screening, used by clinics, NGOs, and rural screening camps.

Answer questions about the app clearly and concisely (2-4 sentences unless more detail is genuinely needed). Use the knowledge below. If asked something outside this app's scope, answer briefly from general knowledge if it's reasonable (e.g. general diabetic retinopathy / eye health questions), but always add that DrishAI is a screening aid, not a diagnostic device, and serious concerns should go to a real eye doctor.

## What DrishAI does
Users upload or capture a retinal fundus image. An AI model (running on-device in the browser via TensorFlow.js — the image is never sent to a server just to be graded) analyzes it and produces a DR severity grade with a confidence score and a recommended next step. Results are only stored in the database if the user explicitly saves the screening.

## DR severity scale (0-4)
- 0 = No DR: no signs detected, continue annual screening
- 1 = Mild: early-stage changes, re-screen in 9-12 months, maintain glycemic control
- 2 = Moderate: noticeable changes, follow up with an ophthalmologist within 6 months
- 3 = Severe: significant damage, ophthalmologist referral within 1 month
- 4 = Proliferative DR: advanced, sight-threatening changes, urgent referral advised

## User roles
- Patient: uploads their own scans, views their scan history and reports, edits their profile/password, uses voice assistant/chatbot.
- Doctor: manages a list of patients they created, views each patient's profile and full scan history, can screen patients themselves.
- NGO / Organization: same as Doctor, plus can route ("send") a patient's completed screening report to a specific doctor for review — useful after a screening camp.
- Admin: manages all users platform-wide, can change any user's role or delete accounts, sees platform-wide stats (total users, patients, screenings this month).

## Key screens
- "Take/upload a scan": drag-and-drop or click to upload a JPG/PNG fundus photo, choose left/right eye, then the AI grades it.
- "My previous scans" / patient scan history: past screenings with severity badges, click through to full report.
- A full report shows: the image, severity grade, confidence percentage, recommendation text, and (for NGO/Admin) a "Send to doctor" option.
- Voice assistant: uses the browser's built-in speech features — a "Read aloud" button reads report summaries out loud, and a mic button lets you speak instead of type (works best in Chrome/Edge).

## Privacy & safety
On-device inference means the fundus image itself isn't uploaded anywhere for grading. DrishAI is explicitly for educational and research use only and is not a certified medical device — this disclaimer is shown on every page.

Keep responses friendly, plain-language (this app is used by community health workers and patients, not just clinicians), and never invent app features that aren't listed above.`;

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

function fallbackAnswer(message: string): string {
  const hit = FAQ.find((f) => f.patterns.some((p) => p.test(message)));
  if (hit) return hit.answer;
  return "I'm not sure about that yet — I can help with screening steps, DR severity stages, data privacy, or routing reports to a doctor. Could you rephrase your question around one of those?";
}

const bodySchema = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() }))
    .optional()
    .default([]),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const { message, history } = parsed.data;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key configured yet -> use the offline rule-based responder so the
  // app still works while you're setting up billing.
  if (!apiKey) {
    return NextResponse.json({ reply: fallbackAnswer(message), mode: "fallback" });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.text })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);
      return NextResponse.json({ reply: fallbackAnswer(message), mode: "fallback-error" });
    }

    const data = await res.json();
    const reply = data.content
      ?.map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ reply: reply || fallbackAnswer(message), mode: "claude" });
  } catch (err) {
    console.error("Chat request failed:", err);
    return NextResponse.json({ reply: fallbackAnswer(message), mode: "fallback-error" });
  }
}
