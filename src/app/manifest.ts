import type { MetadataRoute } from "next";
import { publicAssetPath } from "@/lib/public-base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const appRoot = publicAssetPath("/");
  const icon192 = publicAssetPath("/icons/pwa-icon-192.png");

  return {
    name: "BRP Parts Catalog",
    short_name: "BRP Catalog",
    description: "Каталог BRP та робочий портал дилерських операцій.",
    id: appRoot,
    start_url: appRoot,
    scope: appRoot,
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: "#0d1117",
    theme_color: "#ea580c",
    orientation: "any",
    lang: "uk",
    dir: "ltr",
    categories: ["business", "productivity", "shopping"],
    prefer_related_applications: false,
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: publicAssetPath("/icons/pwa-icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: publicAssetPath("/icons/pwa-icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Мої замовлення",
        short_name: "Замовлення",
        description: "Відкрити історію та поточні статуси замовлень.",
        url: publicAssetPath("/dealer/orders/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Чернетки замовлень",
        short_name: "Чернетки",
        description: "Відкрити збережені чернетки замовлень.",
        url: publicAssetPath("/dealer/order-drafts/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Графік поставки",
        short_name: "Поставки",
        description: "Відкрити найближчі поставки та слоти.",
        url: publicAssetPath("/dealer/schedule/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
