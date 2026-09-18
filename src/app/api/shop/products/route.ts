import { NextResponse } from "next/server";
import { getShopCatalogue } from "@/lib/ghl-products";

export const revalidate = 60;

export async function GET() {
  const catalogue = await getShopCatalogue();

  return NextResponse.json(catalogue, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
