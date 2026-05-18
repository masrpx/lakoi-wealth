"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUIStore } from "@/lib/store/ui";
import { PresentationToggle } from "@/components/layout/PresentationToggle";
import { DisclaimerModal } from "@/components/layout/DisclaimerModal";
import { FooterDisclaimer } from "@/components/layout/FooterDisclaimer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useUIStore();

  return (
    <div data-mode={mode} className="relative">
      <DisclaimerModal />

      {/* Page transition: fade + 8px Y-shift enter */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>

      <PresentationToggle />
      <FooterDisclaimer />
    </div>
  );
}
