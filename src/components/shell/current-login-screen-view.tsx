"use client";

import {Eye, EyeOff, LockKeyhole, LogIn, Mail} from "lucide-react";
import type {LoginScreenViewProps} from "./login-screen-view-props";

export function CurrentLoginScreenView({
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
}: LoginScreenViewProps) {
  return (
    <main className="login-canvas" data-brp-login-renderer="current">
      <form className="login-card" onSubmit={onSubmit}>
        <header className="login-header">
          <span className="login-icon"><LogIn size={21} /></span>
          <div>
            <h1>З поверненням</h1>
            <p>Увійдіть для доступу до каталогу запчастин BRP</p>
          </div>
        </header>
        <div className="login-body">
          <label className="field">
            <span>Електронна пошта</span>
            <div className="input-with-icon">
              <Mail size={15} />
              <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="name@company.com" autoComplete="email" />
            </div>
          </label>
          <label className="field">
            <span>Пароль</span>
            <div className="input-with-icon">
              <LockKeyhole size={15} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="input-trailing" aria-label={showPassword ? "Приховати пароль" : "Показати пароль"} onClick={() => onShowPasswordChange(!showPassword)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          <label className="remember-row">
            <input type="checkbox" checked={remember} onChange={(event) => onRememberChange(event.target.checked)} />
            <span>Запам&apos;ятати на 30 днів</span>
          </label>
          <button
            type="submit"
            className="button button-primary button-wide"
            disabled={!email.trim() || !password || submitting}
            aria-busy={submitting}
          >
            Увійти
          </button>
        </div>
      </form>
    </main>
  );
}
