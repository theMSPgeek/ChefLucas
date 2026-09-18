import Link from "next/link";
import { isDemoMode } from "@/lib/demo";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="relative z-[60] bg-ink text-cream">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2 text-center text-[11px] tracking-[0.18em] uppercase">
        <span className="text-gold">Demo site</span>
        <span className="hidden text-parchment/50 sm:inline">—</span>
        <span>Not live bookings or charges</span>
        <Link
          href="/book"
          className="text-gold underline-offset-4 hover:underline"
        >
          Try the enquiry path
        </Link>
      </p>
    </div>
  );
}
