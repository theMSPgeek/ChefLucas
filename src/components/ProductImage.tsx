"use client";

import Image from "next/image";
import { useState } from "react";
import { productImageUrl } from "@/lib/products";

function CreamPlaceholder({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-warm ${className || "h-full w-full"}`}
      role="img"
      aria-label={name}
    >
      <span className="font-display text-lg text-muted/40">Chef Lucas</span>
    </div>
  );
}

export function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
}) {
  const url = productImageUrl(src);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <CreamPlaceholder name={alt} className={fill ? "absolute inset-0" : className} />;
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
