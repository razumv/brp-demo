"use client";

import {useLayoutEffect, useRef} from "react";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {Switch} from "@astryxdesign/core/Switch";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Eye, EyeOff, LockKeyhole, LogIn, Mail} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import type {LoginScreenViewProps} from "./login-screen-view-props";
import styles from "./astryx-login-screen.module.css";

export default function AstryxLoginScreenView({
  email,
  password,
  remember,
  showPassword,
  submitting,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onShowPasswordChange,
  onSubmit,
  onReady,
}: LoginScreenViewProps & AstryxRendererViewProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  // Astryx TextInput intentionally exposes only cross-input props. Preserve the
  // browser password-manager contract of the current login form on its input refs.
  useLayoutEffect(() => {
    emailInputRef.current?.setAttribute("autocomplete", "email");
    passwordInputRef.current?.setAttribute("autocomplete", "current-password");
  }, []);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.canvas} data-brp-login-renderer="astryx">
        <Card className={styles.card} padding={0} width="100%">
          <form className={styles.form} onSubmit={onSubmit}>
            <header className={styles.header}>
              <span className={styles.headerIcon} aria-hidden="true"><LogIn size={21} /></span>
              <Heading level={1}>З поверненням</Heading>
              <Text color="secondary" display="block">Увійдіть для доступу до каталогу запчастин BRP</Text>
            </header>
            <div className={styles.body}>
              <TextInput
                label="Електронна пошта"
                htmlName="email"
                onChange={onEmailChange}
                placeholder="name@company.com"
                startIcon={<Mail size={16} aria-hidden="true" />}
                type="email"
                ref={emailInputRef}
                value={email}
                width="100%"
              />
              <div className={styles.passwordField}>
                <TextInput
                  label="Пароль"
                  htmlName="password"
                  onChange={onPasswordChange}
                  placeholder="••••••••"
                  startIcon={<LockKeyhole size={16} aria-hidden="true" />}
                  type={showPassword ? "text" : "password"}
                  ref={passwordInputRef}
                  value={password}
                  width="100%"
                />
                <IconButton
                  icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  label={showPassword ? "Приховати пароль" : "Показати пароль"}
                  onClick={() => onShowPasswordChange(!showPassword)}
                  variant="ghost"
                />
              </div>
              <Switch
                label="Запам’ятати на 30 днів"
                onChange={onRememberChange}
                value={remember}
              />
              <Button
                isDisabled={!email.trim() || !password || submitting}
                isLoading={submitting}
                label="Увійти"
                type="submit"
                variant="primary"
                width="100%"
              />
            </div>
          </form>
        </Card>
      </main>
    </AstryxBrpUiProvider>
  );
}
