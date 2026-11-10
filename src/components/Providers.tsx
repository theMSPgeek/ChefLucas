"use client";

import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/components/CartProvider";
import type { ReactNode } from "react";

export function Providers({
  children,
  writesEnabled,
}: {
  children: ReactNode;
  writesEnabled: boolean;
}) {
  return (
    <CartProvider>
      {children}
      <CartDrawer writesEnabled={writesEnabled} />
    </CartProvider>
  );
}
