"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/cn";

export function LoginForm() {
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de se connecter",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-8">
      {error ? (
        <p
          role="alert"
          className="text-center text-sm text-red-600 animate-in fade-in"
        >
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-2">
        <span
          className={cn(
            "text-sm transition-colors",
            focused === "email" || email
              ? "font-medium text-neutral-900"
              : "text-neutral-400",
          )}
        >
          Adresse e-mail
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          disabled={submitting}
          className={cn(
            "w-full border-0 border-b bg-transparent px-0 pb-2 text-base text-neutral-900 outline-none transition-colors",
            "placeholder:text-transparent",
            "disabled:opacity-50",
            focused === "email"
              ? "border-b-2 border-neutral-900"
              : "border-b border-neutral-300",
          )}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span
          className={cn(
            "text-sm transition-colors",
            focused === "password" || password
              ? "font-medium text-neutral-900"
              : "text-neutral-400",
          )}
        >
          Mot de passe
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onFocus={() => setFocused("password")}
          onBlur={() => setFocused(null)}
          disabled={submitting}
          className={cn(
            "w-full border-0 border-b bg-transparent px-0 pb-2 text-base text-neutral-900 outline-none transition-colors",
            "placeholder:text-transparent",
            "disabled:opacity-50",
            focused === "password"
              ? "border-b-2 border-neutral-900"
              : "border-b border-neutral-300",
          )}
        />
      </label>

      <button
        type="submit"
        disabled={submitting || status === "loading"}
        className={cn(
          "mt-4 w-full bg-[#ffd200] py-3.5 text-sm font-bold tracking-[0.12em] text-white uppercase",
          "transition-[transform,filter,opacity] duration-200",
          "hover:brightness-95 active:scale-[0.99]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        )}
      >
        {submitting ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
