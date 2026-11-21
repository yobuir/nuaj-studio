/**
 * POST /api/commission — receives the commission form.
 *
 * Sends the enquiry (with any photos attached) by email through Resend
 * (https://resend.com — free tier is plenty). Set these on your host:
 *   RESEND_API_KEY         your Resend API key
 *   COMMISSION_TO_EMAIL    where enquiries should arrive
 *   COMMISSION_FROM_EMAIL  optional, e.g. "Nuaj Studio <studio@your-domain.com>"
 *                          (domain must be verified in Resend)
 * Without them the route answers 503 and the form shows an email fallback.
 */
import { NextResponse } from "next/server";
import { EMAIL_RE, sendEnquiry } from "@/lib/sendEnquiry";

export const runtime = "nodejs";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: real people never fill the hidden "website" field
  if (String(form.get("website") ?? "").trim()) return NextResponse.json({ ok: true });

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  const errors: Record<string, string> = {};
  if (!name || name.length > 120) errors.name = "Please tell me your name.";
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Please enter a valid email address.";
  if (message.length < 10 || message.length > 5000) errors.message = "Please tell me a little about your idea (10–5000 characters).";
  if (photos.length > MAX_PHOTOS) errors.photos = `Please attach up to ${MAX_PHOTOS} photos.`;
  if (photos.some((f) => !f.type.startsWith("image/") || f.size > MAX_BYTES)) errors.photos = "Photos must be images under 5 MB each.";
  if (Object.keys(errors).length) return NextResponse.json({ error: "invalid", errors }, { status: 422 });

  const result = await sendEnquiry({
    subject: `New commission enquiry — ${name}`,
    replyTo: email,
    fields: [["Name", name], ["Email", email]],
    message,
    attachments: photos,
  });
  if (result === "not_configured") return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (result === "send_failed") return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
