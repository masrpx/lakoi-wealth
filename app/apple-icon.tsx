import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0e1a",
        borderRadius: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#c9a84c",
        fontWeight: 900,
        fontSize: "128px",
        fontFamily: "serif",
        lineHeight: 1,
        paddingTop: "12px",
      }}
    >
      L
    </div>,
    { ...size }
  );
}
