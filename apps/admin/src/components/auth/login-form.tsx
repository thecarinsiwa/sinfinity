"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

export function LoginForm() {
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      {error ? (
        <Alert tone="danger" title="Échec de la connexion">
          {error}
        </Alert>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Adresse e-mail</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@sinfinity.cd"
          disabled={submitting}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Mot de passe</span>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          disabled={submitting}
        />
      </label>

      <Button type="submit" disabled={submitting || status === "loading"}>
        {submitting ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
