"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = "0",
  min = 0,
  max,
  className,
  disabled,
}: CurrencyInputProps) {
  const format = (n: number) => (n === 0 ? "" : n.toLocaleString("th-TH"));
  const [display, setDisplay] = useState(format(value));
  const [focused, setFocused] = useState(false);

  // Sync when parent changes value externally
  useEffect(() => {
    if (!focused) setDisplay(format(value));
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    setDisplay(value === 0 ? "" : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setDisplay(raw);
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseInt(display.replace(/,/g, ""), 10);
    const clamped = isNaN(parsed) ? 0 : max !== undefined ? Math.min(parsed, max) : parsed;
    const final = Math.max(min, clamped);
    onChange(final);
    setDisplay(format(final));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-sm text-muted-foreground">{label}</Label>
      )}
      <div className="relative flex items-center">
        <span
          className="absolute left-3 text-sm font-medium select-none pointer-events-none"
          style={{ color: "var(--gold-500)" }}
        >
          ฿
        </span>
        <Input
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          className="pl-7 min-h-[44px] bg-background border-border focus:border-[var(--gold-500)] focus:ring-[var(--gold-500)]"
        />
      </div>
    </div>
  );
}
