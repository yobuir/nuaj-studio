import type { Metadata } from "next";
import KeystaticApp from "./keystatic";
import { keystaticMode } from "../../keystatic.config";

export const metadata: Metadata = { title: "Content editor", robots: { index: false, follow: false } };

export default function KeystaticLayout() {
  if (keystaticMode() === "disabled") {
    return (
      <main style={{ maxWidth: 560, margin: "15vh auto", padding: 24, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
        <h1 style={{ fontFamily: "inherit", fontSize: 28, marginBottom: 12 }}>The content editor isn’t connected yet</h1>
        <p>
          To edit the live site, connect Keystatic to GitHub (README → “Content editor”). Until then, edit content locally
          with <code>npm run dev</code> and open <code>/keystatic</code>.
        </p>
      </main>
    );
  }
  return <KeystaticApp />;
}
