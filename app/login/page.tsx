"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Имэйл эсвэл нууц үг буруу байна.");
      setBusy(false);
      return;
    }
    window.location.replace("/");
  };

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 h-14 w-14 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/192" alt="" className="h-full w-full" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">2027 оны зун гэхэд</h1>
        <p className="mt-1 text-muted">Өдөр бүр бага багаар.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          required
          placeholder="Имэйл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
        />
        <input
          type="password"
          autoComplete="current-password"
          required
          placeholder="Нууц үг"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-14 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
        />
        {error && <p className="px-1 text-[14px] text-accent-text">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-xl bg-accent font-semibold text-accent-ink active:opacity-90 disabled:opacity-60"
        >
          {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </button>
      </form>
    </main>
  );
}
