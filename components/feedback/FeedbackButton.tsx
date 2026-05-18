"use client";

import { useState } from "react";
import { MessageSquare, Star, Send, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mrbzplkd";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0 && text.trim() === "") return;
    setSubmitting(true);
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ rating, feedback: text, _subject: `Lakoi Feedback — ${rating}★` }),
      });
      setSubmitted(true);
    } catch {
      // fallback: mailto
      const body = encodeURIComponent(`คะแนน: ${rating}/5\n\n${text}`);
      window.location.href = `mailto:siraphobra@gmail.com?subject=Lakoi Feedback&body=${body}`;
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => { setSubmitted(false); setRating(0); setText(""); }, 400);
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        className="fixed z-40 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          left: "16px",
          background: "var(--bg-surface)",
          color: "var(--text-secondary)",
          border: "1.5px solid var(--border)",
          touchAction: "manipulation",
        }}
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        ความเห็น
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl px-5 pb-8 pt-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", maxHeight: "80vh" }}>

          <SheetHeader className="flex flex-row items-center justify-between mb-5">
            <SheetTitle className="text-base font-semibold">แสดงความคิดเห็น</SheetTitle>
            <SheetClose
              className="rounded-full p-1.5"
              style={{ background: "var(--bg-elevated)" }}
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </SheetClose>
          </SheetHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(45,212,191,0.15)" }}
              >
                <Send className="h-6 w-6" style={{ color: "var(--teal-500)" }} />
              </div>
              <p className="font-semibold">ขอบคุณสำหรับความเห็น!</p>
              <p className="text-sm text-muted-foreground text-center">ข้อมูลของคุณจะช่วยให้เราพัฒนาแอปได้ดีขึ้น</p>
              <Button
                className="mt-3"
                style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
                onClick={handleClose}
              >
                ปิด
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Star rating */}
              <div>
                <p className="text-sm font-medium mb-3">ให้คะแนนประสบการณ์การใช้งาน</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="p-1 transition-transform active:scale-90"
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                    >
                      <Star
                        className="h-8 w-8 transition-colors"
                        style={{
                          fill: n <= (hovered || rating) ? "var(--gold-500)" : "transparent",
                          stroke: n <= (hovered || rating) ? "var(--gold-500)" : "var(--border)",
                        }}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {["", "ต้องปรับปรุง", "พอใช้ได้", "ดี", "ดีมาก", "ยอดเยี่ยม"][rating]}
                  </p>
                )}
              </div>

              {/* Text area */}
              <div>
                <p className="text-sm font-medium mb-2">ความเห็นเพิ่มเติม (ไม่บังคับ)</p>
                <textarea
                  className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    minHeight: "100px",
                  }}
                  placeholder="ฟีเจอร์ที่ชอบ ปัญหาที่พบ หรือสิ่งที่อยากให้เพิ่มเติม..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <Button
                className="w-full h-11 text-sm font-semibold gap-2"
                style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
                disabled={rating === 0 || submitting}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
                {submitting ? "กำลังส่ง..." : "ส่งความเห็น"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
