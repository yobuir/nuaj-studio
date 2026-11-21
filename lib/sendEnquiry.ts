/**
 * sendEnquiry — shared by the commission and contact forms.
 * Emails an enquiry through Resend (https://resend.com).
 *
 * Environment variables (set on your host):
 *   RESEND_API_KEY         your Resend API key
 *   COMMISSION_TO_EMAIL    the inbox that receives enquiries (both forms)
 *   COMMISSION_FROM_EMAIL  optional sender, e.g. "Nuaj Studio <studio@your-domain.com>"
 *
 * Returns "not_configured" when the variables are missing, so the page can
 * show the studio email instead.
 */
export type SendResult = "ok" | "not_configured" | "send_failed";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEnquiry(opts: {
  subject: string;
  replyTo: string;
  fields: [label: string, value: string][];
  message: string;
  attachments?: File[];
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.COMMISSION_TO_EMAIL;
  if (!key || !to) return "not_configured";

  const attachments = await Promise.all(
    (opts.attachments ?? []).map(async (f) => ({
      filename: f.name || "photo.jpg",
      content: Buffer.from(await f.arrayBuffer()).toString("base64"),
    })),
  );
  const rows = opts.fields.map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v)}`).join("<br>");
  const n = attachments.length;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.COMMISSION_FROM_EMAIL || "Nuaj Studio <onboarding@resend.dev>",
      to: [to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: `<h2>${esc(opts.subject)}</h2><p>${rows}</p><p style="white-space:pre-wrap">${esc(opts.message)}</p>${n ? `<p>${n} photo(s) attached.</p>` : ""}`,
      text: `${opts.fields.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${opts.message}${n ? `\n\n${n} photo(s) attached.` : ""}`,
      ...(n ? { attachments } : {}),
    }),
  });
  if (!res.ok) {
    console.error("[enquiry] Resend error", res.status, await res.text().catch(() => ""));
    return "send_failed";
  }
  return "ok";
}
