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
        name: "Воронка замовлень",
        short_name: "Замовлення",
        description: "Відкрити операційну воронку замовлень.",
        url: publicAssetPath("/admin/order-pipeline/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Графік доставки",
        short_name: "Доставки",
        description: "Відкрити графік і хронологію доставок.",
        url: publicAssetPath("/admin/schedule/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Каталог запчастин",
        short_name: "Каталог",
        description: "Відкрити каталог запчастин BRP.",
        url: publicAssetPath("/catalog/"),
        icons: [{ src: icon192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
