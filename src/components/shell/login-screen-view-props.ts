import type {FormEvent} from "react";

export type LoginScreenViewProps = {
  email: string;
  password: string;
  remember: boolean;
  showPassword: boolean;
  submitting: boolean;
  onEmailChange(email: string): void;
  onPasswordChange(password: string): void;
  onRememberChange(remember: boolean): void;
  onShowPasswordChange(showPassword: boolean): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
};
