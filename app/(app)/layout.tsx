import { BottomNav } from "@/components/ui/BottomNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto min-h-dvh max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">{children}</main>
      <BottomNav />
    </>
  );
}
