"use client";

import { useEffect, useRef, useState } from "react";
import { publicAssetPath } from "@/lib/public-base-path";

const serviceWorkerUrl = publicAssetPath("/sw.js");
const serviceWorkerScope = publicAssetPath("/");

export function PwaRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadOnControllerChange = useRef(false);
  const hasReloadedAfterUpdate = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PWA_ENABLED !== "true" || !("serviceWorker" in navigator)) return;

    let active = true;
    let disposeRegistrationListeners = () => {};
    let disposeInstallingWorkerListener = () => {};

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: serviceWorkerScope,
          updateViaCache: "none",
        });

        if (!active) return;

        const publishWaitingWorker = () => {
          if (active && registration.waiting && navigator.serviceWorker.controller) {
            setWaitingWorker(registration.waiting);
          }
        };

        const handleUpdateFound = () => {
          disposeInstallingWorkerListener();
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          const handleStateChange = () => {
            if (installingWorker.state === "installed") publishWaitingWorker();
            if (installingWorker.state === "installed" || installingWorker.state === "redundant") {
              disposeInstallingWorkerListener();
            }
          };

          installingWorker.addEventListener("statechange", handleStateChange);
          disposeInstallingWorkerListener = () => {
            installingWorker.removeEventListener("statechange", handleStateChange);
            disposeInstallingWorkerListener = () => {};
          };
          handleStateChange();
        };

        const handleControllerChange = () => {
          if (!reloadOnControllerChange.current || hasReloadedAfterUpdate.current) return;
          hasReloadedAfterUpdate.current = true;
          window.location.reload();
        };

        registration.addEventListener("updatefound", handleUpdateFound);
        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
        disposeRegistrationListeners = () => {
          registration.removeEventListener("updatefound", handleUpdateFound);
          navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
        };

        handleUpdateFound();
        publishWaitingWorker();
        await registration.update();
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
      disposeInstallingWorkerListener();
      disposeRegistrationListeners();
      window.removeEventListener("load", register);
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) return;

    try {
      reloadOnControllerChange.current = true;
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setWaitingWorker(null);
    } catch (error) {
      reloadOnControllerChange.current = false;
      console.warn("BRP PWA update activation failed", error);
    }
  };

  if (!waitingWorker) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 ml-auto max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-menu)] sm:left-auto"
      role="status"
    >
      <p>Доступне оновлення BRP. Застосуйте його, коли завершите поточну дію.</p>
      <button
        className="mt-2 min-h-11 rounded-md bg-[var(--orange)] px-3 py-2 font-medium text-white hover:bg-[var(--orange-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange)]"
        onClick={applyUpdate}
        type="button"
      >
        Оновити після завершення
      </button>
    </aside>
  );
}
