"use client";

import { useRef, useState, type RefObject } from "react";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PdfMetric } from "./PdfDocument";

interface Props {
  captureRef: RefObject<HTMLElement | null>;
  title: string;
  metrics?: PdfMetric[];
}

type ExportState = "idle" | "capturing" | "generating";

export function ExportMenu({ captureRef, title, metrics }: Props) {
  const [open, setOpen] = useState(false);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const menuRef = useRef<HTMLDivElement>(null);

  async function captureImage(): Promise<string | null> {
    const el = captureRef.current;
    if (!el) return null;
    const { toPng } = await import("html-to-image");
    return toPng(el as HTMLElement, {
      pixelRatio: 1.5,
      backgroundColor: "#111827",
      skipFonts: false,
    });
  }

  async function handleExportImage() {
    setOpen(false);
    setExportState("capturing");
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExportState("idle");
    }
  }

  async function handleExportPdf() {
    setOpen(false);
    setExportState("capturing");
    try {
      const chartImageDataUrl = await captureImage();
      setExportState("generating");

      const { pdf, Font } = await import("@react-pdf/renderer");
      const { LakоiWealthPdf } = await import("./PdfDocument");
      const { createElement } = await import("react");

      // Register Thai font right before generation — needs to be accessible at this URL
      const origin = window.location.origin;
      Font.register({
        family: "Sarabun",
        fonts: [
          { src: `${origin}/fonts/Sarabun-Regular.ttf`, fontWeight: "normal" },
          { src: `${origin}/fonts/Sarabun-Bold.ttf`,    fontWeight: "bold" },
        ],
      });

      const doc = createElement(LakоiWealthPdf, {
        title,
        chartImageDataUrl: chartImageDataUrl ?? undefined,
        metrics,
      });

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-")}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportState("idle");
    }
  }

  const busy = exportState !== "idle";

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        className="h-10 px-4 gap-2 text-sm font-medium"
        style={{
          border: "1.5px solid rgba(201,168,76,0.45)",
          color: "var(--gold-500)",
          background: "rgba(201,168,76,0.07)",
        }}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {busy
          ? exportState === "capturing"
            ? "กำลังบันทึก..."
            : "สร้าง PDF..."
          : "Export"}
      </Button>

      {open && !busy && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-12 z-50 rounded-xl overflow-hidden min-w-[170px]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <button
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-white/5 transition-colors"
              onClick={handleExportImage}
            >
              <FileImage className="h-4 w-4 text-muted-foreground" />
              บันทึกเป็นรูป
            </button>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-white/5 transition-colors"
              onClick={handleExportPdf}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
