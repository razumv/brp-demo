"use client";

import {
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {
  type AppShellController,
  useAdminAppShellController,
  useDealerAppShellController,
} from "@/components/shell/app-shell-controller";
import {
  CurrentAppShellHeader,
  CurrentAppShellNavigation,
  CurrentAppShellOverlays,
} from "@/components/shell/current-app-shell-view";
import {usePersistedBooleanPreference} from "@/components/shell/use-shell-preferences";
import type {Role} from "@/lib/types";

const loadAstryxShellHeader = () => import("./astryx-app-shell-view").then((module) => ({
  default: module.AstryxAppShellHeader,
}));
const loadAstryxShellNavigation = () => import("./astryx-app-shell-view").then((module) => ({
  default: module.AstryxAppShellNavigation,
}));
const loadAstryxShellOverlays = () => import("./astryx-app-shell-view").then((module) => ({
  default: module.AstryxAppShellOverlays,
}));

function ShellAccessGate() {
  return (
    <main className="auth-loading" aria-live="polite">
      <span className="skeleton" />
      <p>Перевіряємо доступ…</p>
    </main>
  );
}

function ShellFrame({
  controller,
  children,
}: {
  controller: AppShellController;
  children: ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inertTargets = useMemo(() => [headerRef, bodyRef] as const, []);
  const [astryxSidebarCollapsed, setAstryxSidebarCollapsed, astryxSidebarPreferencesReady] = usePersistedBooleanPreference("brp-clone-ui-v1:astryx-sidebar-collapsed", false);
  const [currentSidebarCollapsed, setCurrentSidebarCollapsed, currentSidebarPreferencesReady] = usePersistedBooleanPreference("brp-clone-ui-v1:current-sidebar-collapsed", false);
  const isAstryxShell = controller.renderedDesignSystem === "astryx";
  const sidebarCollapsed = isAstryxShell ? astryxSidebarCollapsed : currentSidebarCollapsed;
  const setSidebarCollapsed = isAstryxShell ? setAstryxSidebarCollapsed : setCurrentSidebarCollapsed;
  const sidebarPreferencesReady = isAstryxShell ? astryxSidebarPreferencesReady : currentSidebarPreferencesReady;

  if (!controller.authorized) return <ShellAccessGate />;

  return (
    <div
      className="app-shell"
      data-brp-shell-renderer={isAstryxShell ? "astryx" : "current"}
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
      data-sidebar-preferences-ready={sidebarPreferencesReady ? "true" : "false"}
    >
      <RendererViewSwitch
        slotId="app-shell-header"
        currentView={<CurrentAppShellHeader controller={controller} headerRef={headerRef} />}
        loadAstryxView={loadAstryxShellHeader}
        astryxViewProps={{controller}}
      />

      <div ref={bodyRef} className="app-body">
        <RendererViewSwitch
          slotId="app-shell-navigation"
          currentView={(
            <CurrentAppShellNavigation
              controller={controller}
              sidebarCollapsed={currentSidebarCollapsed}
              onSidebarCollapsedChange={setCurrentSidebarCollapsed}
            />
          )}
          loadAstryxView={loadAstryxShellNavigation}
          astryxViewProps={{
            controller,
            sidebarCollapsed,
            onSidebarCollapsedChange: setSidebarCollapsed,
          }}
        />

        {/* The route subtree never enters a renderer switch, so local page state survives. */}
        <main id="brp-route-content" className="app-main">
          {children}
        </main>
      </div>

      <RendererViewSwitch
        slotId="app-shell-overlays"
        currentView={<CurrentAppShellOverlays controller={controller} inertTargets={inertTargets} />}
        loadAstryxView={loadAstryxShellOverlays}
        astryxViewProps={{controller}}
      />
    </div>
  );
}

function AdminShell({children}: {children: ReactNode}) {
  const controller = useAdminAppShellController();
  return <ShellFrame controller={controller}>{children}</ShellFrame>;
}

function DealerShell({children}: {children: ReactNode}) {
  const controller = useDealerAppShellController();
  return <ShellFrame controller={controller}>{children}</ShellFrame>;
}

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  return role === "dealer"
    ? <DealerShell>{children}</DealerShell>
    : <AdminShell>{children}</AdminShell>;
}
