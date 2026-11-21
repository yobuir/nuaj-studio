"use client";

/**
 * ContactForm — name, email, topic, message. Posts to /api/contact.
 * Shares its look with the commission form. Copy: content/contact.json → "form".
 */
import { useState } from "react";
import Button from "@/components/ui/Button";
import styles from "./CommissionForm.module.css";

type Copy = {
  title: string;
  name: string;
  email: string;
  topic: string;
  topics: string[];
  message: string;
  messageHint: string;
  button: string;
  success: string;
  notConfigured: string;
  error: string;
};

export default function ContactForm({ copy, email }: { copy: Copy; email: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "not_configured" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const errs: Record<string, string> = {};
    if (!String(data.get("name")).trim()) errs.name = "Please tell me your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email")).trim())) errs.email = "Please enter a valid email address.";
    if (String(data.get("message")).trim().length < 5) errs.message = "Please write a short message.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (res.ok) {
        setStatus("done");
        form.reset();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 422 && body.errors) {
        setErrors(body.errors);
        setStatus("idle");
      } else setStatus(res.status === 503 ? "not_configured" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className={styles.done} role="status">
        <svg viewBox="0 0 120 40" aria-hidden="true" className={styles.doneThread}>
          <path d="M2 30 C30 30 30 8 60 8 C90 8 90 30 118 30" pathLength={100} />
        </svg>
        <p>{copy.success}</p>
      </div>
    );
  }

  const field = (id: string) => ({
    id: `m-${id}`,
    name: id,
    "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `m-${id}-err` : undefined,
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2 className={styles.title}>{copy.title}</h2>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="m-website">Website</label>
        <input id="m-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="m-name">{copy.name}</label>
          <input {...field("name")} autoComplete="name" required />
          {errors.name ? <p id="m-name-err" className={styles.err}>{errors.name}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="m-email">{copy.email}</label>
          <input {...field("email")} type="email" autoComplete="email" required />
          {errors.email ? <p id="m-email-err" className={styles.err}>{errors.email}</p> : null}
        </div>
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.label}>{copy.topic}</legend>
        <div className={styles.chips}>
          {copy.topics.map((t, i) => (
            <label key={t} className={styles.chip}>
              <input type="radio" name="topic" value={t} defaultChecked={i === 0} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="m-message">{copy.message}</label>
        <textarea {...field("message")} rows={6} placeholder={copy.messageHint} required />
        {errors.message ? <p id="m-message-err" className={styles.err}>{errors.message}</p> : null}
      </div>

      <div className={styles.actions}>
        <Button type="submit" size="lg">
          {status === "sending" ? "Sending…" : copy.button}
        </Button>
        <p className={styles.status} role="status" aria-live="polite">
          {status === "not_configured" || status === "error" ? (
            <>
              {status === "error" ? copy.error : copy.notConfigured} <a href={`mailto:${email}`}>{email}</a>
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
