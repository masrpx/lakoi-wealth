"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "lakoi-disclaimer-v1";

export function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 space-y-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  <ShieldCheck className="h-6 w-6" style={{ color: "var(--gold-500)" }} />
                </div>
                <div>
                  <h2 className="text-base font-bold mb-1">ข้อตกลงการใช้งาน</h2>
                  <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    Lakoi Wealth เป็นเครื่องมือช่วยวิเคราะห์และวางแผนทางการเงินสำหรับผู้แนะนำการลงทุน
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 text-xs space-y-2.5"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", lineHeight: 1.75 }}
              >
                <p>• ข้อมูลและตัวเลขทั้งหมดในแอปพลิเคชันนี้เป็นการคาดการณ์เท่านั้น ไม่ถือเป็นการรับประกันผลตอบแทน</p>
                <p>• ไม่ถือเป็นคำแนะนำการลงทุน การประกันภัย หรือคำปรึกษาทางการเงินแต่อย่างใด</p>
                <p>• ผลตอบแทนในอดีตไม่ได้เป็นเครื่องยืนยันผลตอบแทนในอนาคต</p>
                <p>• ผู้ใช้งานมีหน้าที่ตรวจสอบความถูกต้องของข้อมูลและการตัดสินใจลงทุนด้วยตนเอง</p>
                <p>• ข้อมูลที่กรอกในแอปจัดเก็บบนอุปกรณ์ของผู้ใช้เท่านั้น ไม่มีการส่งข้อมูลออกไปภายนอก</p>
              </div>

              <Button
                className="w-full h-12 text-base font-bold"
                style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
                onClick={accept}
              >
                รับทราบและเริ่มใช้งาน
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
