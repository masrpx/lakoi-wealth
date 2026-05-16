export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Sprint 2+</p>
      <h1 className="mt-2 text-3xl font-bold" style={{ color: "var(--gold-500)" }}>
        UL Lifetime View
      </h1>
      <p className="mt-4 text-muted-foreground">Coming in Sprint 2</p>
      <a href="/" className="mt-8 text-sm underline text-muted-foreground">← Back to Design System</a>
    </div>
  );
}
