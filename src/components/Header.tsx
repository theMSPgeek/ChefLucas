"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { nav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
  const overHero = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-50 border-b ${
        overHero
          ? "border-white/10 bg-ink/70 text-cream backdrop-blur-md"
          : "border-line bg-cream/90 text-ink backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Home">
          <Image
            src="/images/logo.png"
            alt=""
            width={120}
            height={72}
            className="h-10 w-auto"
            priority
          />
          <span className="hidden font-display text-lg tracking-[0.18em] sm:block">
            {site.name.toUpperCase()}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] tracking-[0.14em] uppercase lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-gold ${
                pathname === item.href ? "text-gold" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative px-3 py-2 text-[12px] tracking-[0.16em] uppercase"
            aria-label={`Open cart, ${count} items`}
          >
            Shop bag
            {count > 0 && (
              <span className="absolute right-0 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] text-ink">
                {count}
              </span>
            )}
          </button>
          <Link
            href="/book"
            className="hidden rounded-full bg-gold px-4 py-2 text-[12px] tracking-[0.16em] text-ink uppercase sm:inline-flex"
          >
            Book
          </Link>
          <button
            type="button"
            className="lg:hidden px-2 py-2"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-px w-6 bg-current" />
            <span className="mt-1.5 block h-px w-6 bg-current" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-cream text-ink lg:hidden"
          >
            <div className="flex flex-col px-5 py-4 text-sm tracking-[0.16em] uppercase">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-3"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/book" className="py-3 text-gold-deep" onClick={() => setOpen(false)}>
                Book an event
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
