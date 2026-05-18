import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0e1a",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#c9a84c",
        fontWeight: 900,
        fontSize: "22px",
        fontFamily: "serif",
        lineHeight: 1,
        paddingTop: "2px",
      }}
    >
      L
    </div>,
    { ...size }
  );
}
