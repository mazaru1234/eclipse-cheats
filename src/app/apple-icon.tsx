import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0b 0%, #1a1508 100%)",
          borderRadius: 36,
          border: "4px solid #e8b923",
          color: "#e8b923",
          fontSize: 96,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        E
      </div>
    ),
    { ...size }
  );
}
