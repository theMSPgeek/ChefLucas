"use client";

import { useState } from "react";

export function OperatorSignIn() {
  const [status, setStatus] = useState<"idle" | "sending" | "in" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const secret = String(new FormData(event.currentTarget).get("secret") || "");
    try {
      const res = await fetch("/api/shop/operator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage("That sign-in was not accepted.");
        return;
      }
      setStatus("in");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  }

  async function signOut() {
    setStatus("sending");
    try {
      await fetch("/api/shop/operator/session", { method: "DELETE" });
    } finally {
      setStatus("idle");
      setMessage("");
    }
  }

  if (status === "in") {
    return (
      <div className="border border-line px-6 py-10">
        <p className="eyebrow">Operator</p>
        <h2 className="mt-3 font-display text-3xl">Session started.</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          This browser can place an operator checkout. HighLevel stock changes only when
          inventory writes are also enabled on the server. Nothing is ever charged.
        </p>
        <button type="button" onClick={signOut} className="btn btn-ghost mt-6">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-5">
      <h2 className="font-display text-3xl">Operator sign-in</h2>
      <p className="text-sm leading-7 text-muted">
        FKIT operators only. This does not place an order. Public checkout stays a demo
        and does not change stock.
      </p>
      <label className="text-sm">
        <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
          Operator secret
        </span>
        <input
          required
          type="password"
          name="secret"
          autoComplete="current-password"
          className="field"
        />
      </label>
      {status === "error" ? <p className="text-sm text-red-800">{message}</p> : null}
      <button type="submit" disabled={status === "sending"} className="btn btn-solid disabled:opacity-40">
        {status === "sending" ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
