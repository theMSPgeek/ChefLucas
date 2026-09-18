import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0E0E0E",
          color: "#F5F0E8",
          padding: "72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 18, letterSpacing: 8, color: "#B8956A" }}>
          CHEF LUCAS CATERING
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>
            Fine dining, brought to your table.
          </div>
          <div style={{ fontSize: 24, color: "#d4c4a8" }}>
            Weddings · Corporate · Buffets · Private kitchens
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#B8956A" }}>Demo by FKIT · not live booking</div>
      </div>
    ),
    size,
  );
}
