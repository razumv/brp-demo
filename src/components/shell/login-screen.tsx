"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { authenticateCredentials } from "@/lib/authenticate";

export function LoginScreen() {
  const router = useRouter();
  const { setSession } = useDemoStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
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
  };

  return (
    <main className="login-canvas">
      <form className="login-card" onSubmit={submit}>
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
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email" />
            </div>
          </label>
          <label className="field">
            <span>Пароль</span>
            <div className="input-with-icon">
              <LockKeyhole size={15} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="input-trailing" aria-label={showPassword ? "Приховати пароль" : "Показати пароль"} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          <label className="remember-row">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
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
