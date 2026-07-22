"use client";

import {useCallback, useState, type FormEvent} from "react";
import { useRouter } from "next/navigation";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {CurrentBrpUiProvider} from "@/components/brp-ui/current-brp-ui-provider";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { authenticateCredentials } from "@/lib/authenticate";
import {CurrentLoginScreenView} from "./current-login-screen-view";
import type {LoginScreenViewProps} from "./login-screen-view-props";

const loadAstryxLoginScreenView = () => import("./astryx-login-screen-view");

export function LoginScreen() {
  const router = useRouter();
  const { setSession } = useDemoStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password || submitting) return;

    setSubmitting(true);
    try {
      const session = await authenticateCredentials({ email, password, remember });
      if (!session) return;
      setSession(session);
      setPassword("");
      router.push(session.role === "dealer" ? "/" : "/admin");
    } finally {
      setSubmitting(false);
    }
  }, [email, password, remember, router, setSession, submitting]);

  const viewProps: LoginScreenViewProps = {
    email,
    password,
    remember,
    showPassword,
    submitting,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onRememberChange: setRemember,
    onShowPasswordChange: setShowPassword,
    onSubmit: submit,
  };

  return (
    <RendererViewSwitch
      astryxViewProps={viewProps}
      currentView={(
        <CurrentBrpUiProvider>
          <CurrentLoginScreenView {...viewProps} />
        </CurrentBrpUiProvider>
      )}
      loadAstryxView={loadAstryxLoginScreenView}
      slotId="login-screen"
    />
  );
}
