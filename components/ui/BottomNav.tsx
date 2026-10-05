"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Өнөөдөр", icon: "today", match: (p) => p === "/" || p.startsWith("/day") },
  { href: "/progress", label: "Явц", icon: "chart", match: (p) => p.startsWith("/progress") },
  { href: "/review", label: "Дүгнэлт", icon: "book", match: (p) => p.startsWith("/review") },
  { href: "/settings", label: "Тохиргоо", icon: "settings", match: (p) => p.startsWith("/settings") },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = t.match(path);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors ${
                  active ? "text-text" : "text-muted"
                }`}
              >
                <Icon name={t.icon} size={24} strokeWidth={active ? 2.25 : 1.75} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
