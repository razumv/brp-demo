import type { Metadata, Viewport } from "next";
import { DemoStoreProvider } from "@/components/providers/demo-store-provider";
import { PwaRegistration } from "@/components/providers/pwa-registration";
import { publicAssetPath } from "@/lib/public-base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BRP Parts Catalog",
    template: "%s · BRP",
  },
  description: "Каталог BRP, дилерський портал і робочі інструменти.",
  applicationName: "BRP Parts Catalog",
  manifest: publicAssetPath("/manifest.webmanifest"),
  icons: {
    icon: publicAssetPath("/favicon.png"),
    apple: publicAssetPath("/icons/apple-touch-icon-180.png"),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BRP Parts Catalog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <DemoStoreProvider>{children}</DemoStoreProvider>
        <PwaRegistration />
      </body>
    </html>
  );
}
