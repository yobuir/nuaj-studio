"use client";

/**
 * CommissionForm — name, email, idea, optional photos (drag & drop).
 * Posts to /api/commission. Labels/messages: content/commission.json → "form".
 */
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import styles from "./CommissionForm.module.css";

type Copy = {
  title: string;
  name: string;
  email: string;
  message: string;
  messageHint: string;
  photos: string;
  photosHint: string;
  button: string;
  success: string;
  notConfigured: string;
  error: string;
};

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;

export default function CommissionForm({ copy, email }: { copy: Copy; email: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "not_configured" | "error">("idle");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // thumbnails for chosen photos
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const tooBig = incoming.some((f) => f.size > MAX_BYTES);
    const next = [...files, ...incoming.filter((f) => f.size <= MAX_BYTES)].slice(0, MAX_PHOTOS);
    setFiles(next);
    setErrors((e) => ({ ...e, photos: tooBig ? "Some photos were over 5 MB and were skipped." : "" }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.delete("photos");
    files.forEach((f) => data.append("photos", f));

    // quick client-side check (the server checks again)
    const errs: Record<string, string> = {};
    if (!String(data.get("name")).trim()) errs.name = "Please tell me your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email")).trim())) errs.email = "Please enter a valid email address.";
    if (String(data.get("message")).trim().length < 10) errs.message = "Please tell me a little about your idea.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/commission", { method: "POST", body: data });
      if (res.ok) {
        setStatus("done");
        form.reset();
        setFiles([]);
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
    id: `c-${id}`,
    name: id,
    "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `c-${id}-err` : undefined,
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2 className={styles.title}>{copy.title}</h2>

      {/* hidden from people, catches bots */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="c-name">{copy.name}</label>
          <input {...field("name")} autoComplete="name" required />
          {errors.name ? <p id="c-name-err" className={styles.err}>{errors.name}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="c-email">{copy.email}</label>
          <input {...field("email")} type="email" autoComplete="email" required />
          {errors.email ? <p id="c-email-err" className={styles.err}>{errors.email}</p> : null}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="c-message">{copy.message}</label>
        <textarea {...field("message")} rows={6} placeholder={copy.messageHint} required />
        {errors.message ? <p id="c-message-err" className={styles.err}>{errors.message}</p> : null}
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="c-photos-label">
          {copy.photos}
        </span>
        <label
          htmlFor="c-photos"
          className={`${styles.drop} ${drag ? styles.dragging : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <span className={styles.dropMain}>Drop photos here, or click to choose</span>
          <span className={styles.dropHint}>{copy.photosHint}</span>
          <input
            ref={inputRef}
            id="c-photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="visually-hidden"
            aria-labelledby="c-photos-label"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {previews.length ? (
          <ul className={styles.thumbs}>
            {previews.map((src, i) => (
              <li key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={files[i]?.name ?? "Selected photo"} />
                <button type="button" aria-label={`Remove ${files[i]?.name ?? "photo"}`} onClick={() => setFiles(files.filter((_, n) => n !== i))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {errors.photos ? <p className={styles.err}>{errors.photos}</p> : null}
      </div>

      <div className={styles.actions}>
        <Button type="submit" size="lg">
          {status === "sending" ? "Sending…" : copy.button}
        </Button>
        <p className={styles.status} role="status" aria-live="polite">
          {status === "not_configured" || status === "error" ? (
            <>
              {status === "error" ? copy.error : copy.notConfigured} <a href={`mailto:${email}?subject=Commission%20enquiry`}>{email}</a>
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
