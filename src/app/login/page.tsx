import type { Metadata } from "next";
import { LoginScreen } from "@/components/shell/login-screen";

export const metadata: Metadata = {
  title: "Вхід",
};

export default function LoginPage() {
  return <LoginScreen />;
}
