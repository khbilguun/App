"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/data";
import { exportJSON, exportZIP } from "@/lib/export";
import { currentSubscription, disablePush, enablePush, pushSupport, sendTestPush, type PushSupport } from "@/lib/push";

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  try {
    if (t === "system") {
      localStorage.removeItem("theme");
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem("theme", t);
      document.documentElement.dataset.theme = t;
    }
  } catch {}
}

export default function SettingsPage() {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = pushSupport();
      const sub = s === "ok" ? await currentSubscription().catch(() => null) : null;
      let t: Theme = "system";
      try {
        t = (localStorage.getItem("theme") as Theme) || "system";
      } catch {}
      if (!alive) return;
      setSupport(s);
      setSubscribed(!!sub);
      setTheme(t);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const togglePush = async () => {
    setPushBusy(true);
    setMsg(null);
    try {
      if (subscribed) {
        await disablePush();
        setSubscribed(false);
      } else {
        await enablePush();
        setSubscribed(true);
        setMsg("Асаалаа. Өдөр бүр 21:00-д, өдөр бүрэн биш бол сануулна.");
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setPushBusy(false);
    }
  };

  const test = async () => {
    setMsg(null);
    try {
      await sendTestPush();
      setMsg("Илгээлээ — хэдэн секундэд ирнэ.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const doExport = async (kind: "json" | "zip") => {
    setExporting(kind === "json" ? "JSON бэлтгэж байна…" : "Бэлтгэж байна…");
    try {
      if (kind === "json") await exportJSON();
      else await exportZIP((d, t) => setExporting(`Зураг татаж байна ${d}/${t}`));
    } catch (e) {
      setMsg(`Экспорт амжилтгүй: ${(e as Error).message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <PageHeader title="Тохиргоо" />

      <SectionTitle>Сануулга</SectionTitle>
      <Card className="divide-y divide-border">
        <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
          <Icon name="bell" className="text-muted" />
          <div className="flex-1">
            <div className="font-medium">Өдөр бүр 21:00</div>
            <div className="text-[13px] text-muted">Өдөр бүрэн бол илгээхгүй</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={subscribed}
            aria-label="Сануулга"
            disabled={support !== "ok" || pushBusy}
            onClick={togglePush}
            className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${subscribed ? "bg-accent" : "bg-surface-2 ring-1 ring-border ring-inset"}`}
          >
            <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${subscribed ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {support === "not-installed" && (
          <p className="px-4 py-3 text-[14px] text-muted">
            iPhone дээр мэдэгдэл авахын тулд: Safari → <b>Share</b> → <b>Add to Home Screen</b>. Дараа нь home screen-ээс нээгээд энд асаана (iOS 16.4+).
          </p>
        )}
        {support === "unsupported" && <p className="px-4 py-3 text-[14px] text-muted">Энэ хөтөч push мэдэгдэл дэмжихгүй байна.</p>}
        {subscribed && (
          <button type="button" onClick={test} className="flex min-h-[56px] w-full items-center justify-between px-4 text-left font-medium">
            Туршилтын мэдэгдэл илгээх <Icon name="chevronRight" className="text-muted" />
          </button>
        )}
      </Card>
      {msg && <p className="mt-2 px-1 text-[14px] text-muted" aria-live="polite">{msg}</p>}

      <div className="mt-6">
        <SectionTitle>Харагдац</SectionTitle>
        <div className="flex rounded-2xl border border-border bg-surface p-1" role="radiogroup">
          {(
            [
              ["system", "Систем"],
              ["light", "Цайвар"],
              ["dark", "Бараан"],
            ] as [Theme, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => {
                setTheme(t);
                applyTheme(t);
              }}
              className={`h-11 flex-1 rounded-xl text-[15px] font-semibold ${theme === t ? "bg-surface-2 text-text" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Экспорт</SectionTitle>
        <Card className="divide-y divide-border">
          <button type="button" disabled={!!exporting} onClick={() => doExport("json")} className="flex min-h-[60px] w-full items-center gap-3 px-4 text-left disabled:opacity-50">
            <Icon name="download" className="text-muted" />
            <span className="flex-1">
              <span className="block font-medium">JSON татах</span>
              <span className="block text-[13px] text-muted">Бүх өдөр, дүгнэлт, зургийн мэдээлэл</span>
            </span>
          </button>
          <button type="button" disabled={!!exporting} onClick={() => doExport("zip")} className="flex min-h-[60px] w-full items-center gap-3 px-4 text-left disabled:opacity-50">
            <Icon name="image" className="text-muted" />
            <span className="flex-1">
              <span className="block font-medium">ZIP татах (зурагтай)</span>
              <span className="block text-[13px] text-muted">data.json + photos/</span>
            </span>
          </button>
        </Card>
        {exporting && <p className="tabular mt-2 px-1 text-[14px] text-muted" aria-live="polite">{exporting}</p>}
      </div>

      <div className="mt-6">
        <Card>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.replace("/login");
            }}
            className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left font-medium"
          >
            <Icon name="logout" className="text-muted" /> Гарах
          </button>
        </Card>
      </div>
      <p className="mt-6 text-center text-[12px] text-muted">2026.10.05 → 2027.06.01 · 239 өдөр</p>
    </div>
  );
}
