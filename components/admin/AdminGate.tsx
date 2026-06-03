"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "lakoi-admin-authed";

function PinDialog({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, "1");
        onSuccess();
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div
        className="rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="text-center">
          <p className="text-xl font-bold" style={{ color: "var(--gold-500)", fontFamily: "var(--font-display)" }}>
            Lakoi Admin
          </p>
          <p className="text-sm text-muted-foreground mt-1">Enter PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="text-center text-lg tracking-widest h-12"
            autoFocus
          />
          {error && (
            <p className="text-xs text-center" style={{ color: "var(--destructive)" }}>
              Incorrect PIN
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || pin.length === 0}
            className="h-11"
            style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
          >
            {loading ? "Verifying…" : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (authed === null) return null;
  if (!authed) return <PinDialog onSuccess={() => setAuthed(true)} />;
  return <>{children}</>;
}
