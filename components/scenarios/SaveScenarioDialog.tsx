"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark } from "lucide-react";

interface Props {
  onSave: (name: string) => void;
}

export function SaveScenarioDialog({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-md cursor-pointer"
          style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
        >
          <Bookmark className="h-4 w-4" />
          บันทึก Scenario
        </span>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">บันทึก Scenario ปัจจุบัน</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ชื่อ Scenario</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="เช่น ซื้อบ้านหลังที่ 2, เพิ่ม Unit Link"
              className="h-11"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
              autoFocus
            />
          </div>
          <Button
            className="w-full h-11 font-semibold"
            style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
