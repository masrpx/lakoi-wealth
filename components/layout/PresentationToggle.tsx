"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Presentation, Pencil } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";

export function PresentationToggle() {
  const { mode, toggleMode } = useUIStore();
  const isPresentation = mode === "presentation";

  return (
    <motion.button
      className="fixed z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        right: "16px",
        background: isPresentation ? "var(--gold-500)" : "var(--bg-surface)",
        color: isPresentation ? "#0a0e1a" : "var(--text-secondary)",
        border: isPresentation ? "none" : "1.5px solid var(--border)",
        boxShadow: isPresentation
          ? "0 4px 20px rgba(201,168,76,0.4)"
          : "0 2px 12px rgba(0,0,0,0.12)",
        touchAction: "manipulation",
      }}
      onClick={toggleMode}
      whileTap={{ scale: 0.94 }}
      layout
    >
      <AnimatePresence mode="wait" initial={false}>
        {isPresentation ? (
          <motion.span
            key="edit"
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Pencil className="h-4 w-4" />
            โหมดทำงาน
          </motion.span>
        ) : (
          <motion.span
            key="pres"
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Presentation className="h-4 w-4" />
            นำเสนอ
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
