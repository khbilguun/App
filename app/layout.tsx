import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Зун 2027",
  description: "2027 оны зун гэхэд — өдөр тутмын checklist",
  applicationName: "Зун 2027",
  appleWebApp: { capable: true, title: "Зун 2027", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

// Гараар сонгосон theme-ийг flash-гүй тавина
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${golos.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
