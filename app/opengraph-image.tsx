import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "iCheckEnergy — Innovation.Energy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/icheck-energy-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #f8fafc 0%, #e7f0ff 55%, #dbe7ff 100%)",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* The logo file already includes the iCheckEnergy wordmark. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} height={108} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 0.4,
              color: "#0058E8",
            }}
          >
            Innovation.Energy
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#111827",
              maxWidth: 860,
            }}
          >
            Solar leads and building insights
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
