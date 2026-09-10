import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion — Sinfinity Admin",
  description: "Connexion à la console d’administration Sinfinity",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Sinfinity Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Connexion
          </h1>
          <p className="text-sm text-muted">
            Accédez à la console d’administration avec votre compte.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href="/system/health"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Vérifier la santé de l’API
          </Link>
        </p>
      </main>
    </div>
  );
}
