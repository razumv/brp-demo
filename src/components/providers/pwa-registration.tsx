"use client";

import { useEffect } from "react";
import { publicAssetPath } from "@/lib/public-base-path";

const serviceWorkerUrl = publicAssetPath("/sw.js");
const serviceWorkerScope = publicAssetPath("/");

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let active = true;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: serviceWorkerScope,
          updateViaCache: "none",
        });

        if (active) await registration.update();
      } catch (error) {
        console.warn("BRP PWA service worker registration failed", error);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      active = false;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
