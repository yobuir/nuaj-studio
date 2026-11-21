/**
 * POST /api/contact — general enquiries (press, wearables, collaborations…).
 * Same email setup as the commission form: see lib/sendEnquiry.ts.
 */
import { NextResponse } from "next/server";
import contact from "@/content/contact.json";
import { EMAIL_RE, sendEnquiry } from "@/lib/sendEnquiry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (String(form.get("website") ?? "").trim()) return NextResponse.json({ ok: true }); // honeypot

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const topicIn = String(form.get("topic") ?? "").trim();
  const topic = contact.form.topics.includes(topicIn) ? topicIn : "Other";
  const message = String(form.get("message") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!name || name.length > 120) errors.name = "Please tell me your name.";
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Please enter a valid email address.";
  if (message.length < 5 || message.length > 5000) errors.message = "Please write a short message (5–5000 characters).";
  if (Object.keys(errors).length) return NextResponse.json({ error: "invalid", errors }, { status: 422 });

  const result = await sendEnquiry({
    subject: `New message (${topic}) — ${name}`,
    replyTo: email,
    fields: [["Name", name], ["Email", email], ["Topic", topic]],
    message,
  });
  if (result === "not_configured") return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (result === "send_failed") return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
