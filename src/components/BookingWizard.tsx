"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  bookingJourney,
  bookingTypes,
  emptyBooking,
  type BookingDraft,
  type BookingTypeId,
} from "@/lib/booking";

const typeAliases: Record<string, BookingTypeId> = {
  wedding: "wedding",
  weddings: "wedding",
  corporate: "corporate",
  buffet: "buffet",
  buffets: "buffet",
  private: "private",
  "private-dining": "private",
  tasting: "tasting",
  "tasting-kitchen": "tasting",
  custom: "custom",
};

const steps = ["Occasion", "The day", "You", "Notes", "Review"] as const;

export function BookingWizard() {
  const searchParams = useSearchParams();
  const initialType =
    typeAliases[searchParams.get("type")?.toLowerCase() || ""] || "";
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>({
    ...emptyBooking,
    eventType: initialType,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    opportunityName: string;
    demo: boolean;
    forwarded: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  const selected = bookingTypes.find((type) => type.id === draft.eventType);

  function update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(draft.eventType);
    if (step === 1) return Boolean(draft.eventDate && draft.guestCount);
    if (step === 2)
      return Boolean(draft.firstName && draft.lastName && draft.email && draft.phone);
    return true;
  }, [draft, step]);

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send enquiry");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-line bg-warm px-6 py-10 sm:px-10 rounded-[10px]">
        <p className="eyebrow">Received</p>
        <h2 className="mt-4 font-display text-4xl">Thank you — we have the shape of the day.</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
          In a live HighLevel account this would land as a named opportunity in{" "}
          <strong>New enquiry</strong>, tagged by event type, with a calendar hold on the
          matching diary. A chef still calls before anything is locked.
        </p>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">Opportunity name</dt>
            <dd className="text-right font-medium">{result.opportunityName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">Mode</dt>
            <dd>{result.forwarded ? "Forwarded to GHL webhook" : "Demo success — webhook not connected"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs tracking-[0.14em] uppercase text-gold-deep">
          Next in the managed story: discovery call → proposal → 20% deposit invoice
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line bg-warm rounded-[10px]">
      <ol className="grid grid-cols-5 border-b border-line text-center text-[10px] tracking-[0.16em] uppercase sm:text-[11px]">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`px-1 py-3 ${index === step ? "bg-ink text-cream" : "text-muted"}`}
          >
            {label}
          </li>
        ))}
      </ol>

      <div className="px-5 py-8 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-3xl">What are we cooking for?</legend>
                <p className="mt-2 text-sm text-muted">
                  Each type maps to its own HighLevel calendar when this demo is wired.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {bookingTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`cursor-pointer rounded-[10px] border px-4 py-4 transition ${
                        draft.eventType === type.id
                          ? "border-gold bg-warm"
                          : "border-line bg-warm hover:border-gold/60"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="eventType"
                        value={type.id}
                        checked={draft.eventType === type.id}
                        onChange={() => update("eventType", type.id)}
                      />
                      <p className="eyebrow">{type.eyebrow}</p>
                      <p className="mt-2 font-display text-2xl">{type.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{type.summary}</p>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <h2 className="font-display text-3xl sm:col-span-2">The day itself</h2>
                <Field label="Event date" htmlFor="eventDate">
                  <input
                    id="eventDate"
                    type="date"
                    required
                    value={draft.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Guest count" htmlFor="guestCount">
                  <input
                    id="guestCount"
                    type="number"
                    min={1}
                    required
                    value={draft.guestCount}
                    onChange={(e) => update("guestCount", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Venue or setting" htmlFor="venue">
                  <input
                    id="venue"
                    value={draft.venue}
                    onChange={(e) => update("venue", e.target.value)}
                    className="field"
                    placeholder="Barn, home, office, marquee…"
                  />
                </Field>
                <Field label="Location" htmlFor="location">
                  <input
                    id="location"
                    value={draft.location}
                    onChange={(e) => update("location", e.target.value)}
                    className="field"
                    placeholder="Town or postcode"
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <h2 className="font-display text-3xl sm:col-span-2">Who should we write to?</h2>
                <Field label="First name" htmlFor="firstName">
                  <input
                    id="firstName"
                    required
                    value={draft.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Last name" htmlFor="lastName">
                  <input
                    id="lastName"
                    required
                    value={draft.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Email" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    required
                    value={draft.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={draft.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Company (corporate leads)" htmlFor="companyName" className="sm:col-span-2">
                  <input
                    id="companyName"
                    value={draft.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="field"
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5">
                <h2 className="font-display text-3xl">Allergens, wishes, wildcards</h2>
                <Field label="Dietary notes" htmlFor="dietary">
                  <textarea
                    id="dietary"
                    rows={3}
                    value={draft.dietary}
                    onChange={(e) => update("dietary", e.target.value)}
                    className="field"
                  />
                </Field>
                <Field label="Anything else" htmlFor="notes">
                  <textarea
                    id="notes"
                    rows={4}
                    value={draft.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="field"
                    placeholder="Greek stall, tasting first, late burger bar…"
                  />
                </Field>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-display text-3xl">Review the enquiry</h2>
                <p className="mt-2 text-sm text-muted">
                  This becomes a HighLevel opportunity named{" "}
                  <em>
                    {selected?.label || "Event"} | date | {draft.guestCount || "—"}pax |{" "}
                    {draft.lastName || "surname"}
                  </em>
                  .
                </p>
                <dl className="mt-6 divide-y divide-line text-sm">
                  <Row label="Type" value={selected?.label} />
                  <Row label="Date" value={draft.eventDate} />
                  <Row label="Guests" value={draft.guestCount} />
                  <Row label="Venue" value={draft.venue} />
                  <Row label="Contact" value={`${draft.firstName} ${draft.lastName}`} />
                  <Row label="Email" value={draft.email} />
                  <Row label="Phone" value={draft.phone} />
                  <Row label="Company" value={draft.companyName} />
                  <Row label="Dietary" value={draft.dietary} />
                  <Row label="Notes" value={draft.notes} />
                </dl>
                {selected && (
                  <p className="mt-6 text-xs uppercase tracking-[0.16em] text-gold-deep">
                    {selected.nextAction}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-6 text-sm text-red-800">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-muted disabled:opacity-30"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="btn btn-solid disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="btn btn-solid disabled:opacity-40"
            >
              {submitting ? "Sending…" : "Send enquiry"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 border-t border-line bg-parchment/30 px-5 py-8 sm:grid-cols-4 sm:px-10">
        {bookingJourney.map((item) => (
          <div key={item.step}>
            <p className="eyebrow">{item.step}</p>
            <p className="mt-2 font-display text-xl">{item.title}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`} htmlFor={htmlFor}>
      <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}
