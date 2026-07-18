import type { Metadata } from "next";
import { DemoStoreProvider } from "@/components/providers/demo-store-provider";
import { publicAssetPath } from "@/lib/public-base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BRP Parts Catalog",
    template: "%s · BRP",
  },
  description: "Interactive BRP parts catalog and dealer operations demonstration.",
  icons: {
    icon: publicAssetPath("/favicon.png"),
  },
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
      </body>
    </html>
  );
}
