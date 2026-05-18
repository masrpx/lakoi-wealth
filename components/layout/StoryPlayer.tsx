"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";

export interface StoryStep {
  headline: string;
  body: string;
}

interface Props {
  steps: StoryStep[];
  onClose: () => void;
}

export function StoryPlayer({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    if (index < steps.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, steps.length, onClose]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(advance, 4500);
    return () => clearTimeout(timer);
  }, [index, paused, advance]);

  const step = steps[index];
  if (!step) return null;

  return (
    <motion.div
      className="fixed inset-x-4 z-40 rounded-2xl overflow-hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 140px)",
        background: "rgba(10,14,26,0.92)",
        border: "1.5px solid var(--gold-500)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(201,168,76,0.25)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Progress bar */}
      <motion.div
        className="h-0.5 origin-left"
        style={{ background: "var(--gold-500)" }}
        key={`progress-${index}-${paused}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: paused ? undefined : 1 }}
        transition={{ duration: paused ? 0 : 4.5, ease: "linear" }}
      />

      <div className="p-5" onClick={() => setPaused((p) => !p)}>
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? "24px" : "6px",
                  background: i <= index ? "var(--gold-500)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <button
            className="p-1 rounded-full"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p className="text-sm font-bold text-white mb-1">{step.headline}</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {paused ? "แตะเพื่อเล่นต่อ" : "แตะเพื่อหยุด"}
          </p>
          <button
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--gold-500)" }}
            onClick={(e) => { e.stopPropagation(); advance(); }}
          >
            {index < steps.length - 1 ? "ถัดไป" : "ปิด"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
