import type { Metadata, Viewport } from "next";
import { AppearanceBootstrapScript } from "@/components/appearance/appearance-bootstrap-script";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { DemoStoreProvider } from "@/components/providers/demo-store-provider";
import { PwaRegistration } from "@/components/providers/pwa-registration";
import { AstryxFoundationProbe } from "@/components/appearance/astryx-foundation-probe";
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
    <html
      data-color-mode="light"
      data-design-system="shadcn"
      data-resolved-theme="light"
      lang="uk"
      suppressHydrationWarning
    >
      <head>
        <AppearanceBootstrapScript />
      </head>
      <body>
        <AppearanceProvider>
          <div id="brp-app-root">
            <DemoStoreProvider>{children}</DemoStoreProvider>
            {process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE === "1" ? (
              <AstryxFoundationProbe />
            ) : null}
          </div>
        </AppearanceProvider>
        <PwaRegistration />
      </body>
    </html>
  );
}
