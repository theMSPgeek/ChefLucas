import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-5xl">This course isn’t on the menu.</h1>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        Return home
      </Link>
    </section>
  );
}
