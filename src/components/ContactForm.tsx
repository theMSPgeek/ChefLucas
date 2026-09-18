"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setStatus("done");
      setMessage(data.opportunityName);
      event.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-line px-6 py-10">
        <p className="eyebrow">Received</p>
        <h2 className="mt-3 font-display text-3xl">A note is on the pass.</h2>
        <p className="mt-3 text-sm text-muted">
          Filed as <strong>{message}</strong> — in live mode this is a tagged HighLevel
          contact in New enquiry, not a live booking.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 border border-line bg-cream px-6 py-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            First name
          </span>
          <input required name="firstName" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            Last name
          </span>
          <input required name="lastName" className="field" />
        </label>
      </div>
      <label className="text-sm">
        <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
          Email
        </span>
        <input required type="email" name="email" className="field" />
      </label>
      <label className="text-sm">
        <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
          Phone
        </span>
        <input required type="tel" name="phone" className="field" />
      </label>
      <label className="text-sm">
        <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
          Message
        </span>
        <textarea required name="notes" rows={5} className="field" />
      </label>
      {status === "error" && <p className="text-sm text-red-800">{message}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-ink px-6 py-3 text-[12px] tracking-[0.16em] text-cream uppercase disabled:opacity-40"
      >
        {status === "sending" ? "Sending…" : "Send a note"}
      </button>
    </form>
  );
}
