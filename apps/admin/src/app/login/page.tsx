import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LoginForm } from "@/components/auth/login-form";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-login",
});

export const metadata: Metadata = {
  title: "Connexion — Sinfinity Admin",
  description: "Connexion à la console d’administration Sinfinity",
};

export default function LoginPage() {
  return (
    <div
      className={`${manrope.variable} relative flex min-h-full flex-1 flex-col font-[family-name:var(--font-login)]`}
    >
      {/* Fond paysage N&B + fondu blanc vers le haut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f7f7f7]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat grayscale contrast-110"
        style={{ backgroundImage: "url(/login-bg.jpg)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#ffffff_0%,rgba(255,255,255,0.96)_40%,rgba(255,255,255,0.55)_58%,transparent_78%)]"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-[22rem] flex-1 flex-col items-center justify-center px-6 py-16 sm:max-w-md">
        <header className="mb-10 flex flex-col items-center text-center animate-[login-rise_0.7s_ease-out]">
          <h1 className="text-[2rem] font-semibold tracking-tight text-neutral-900 lowercase sm:text-[2.35rem]">
            sinfinity
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="grid grid-cols-2 gap-0.5" aria-hidden>
              <span className="size-1.5 bg-[#ffd200]" />
              <span className="size-1.5 bg-[#ffd200]" />
              <span className="size-1.5 bg-[#ffd200]" />
              <span className="size-1.5 bg-[#ffd200]" />
            </span>
            <p className="text-[0.7rem] font-medium tracking-[0.18em] text-neutral-500 uppercase">
              Admin
            </p>
          </div>
        </header>

        <p className="mb-12 max-w-sm text-center text-[0.9rem] leading-relaxed text-neutral-400 animate-[login-rise_0.85s_ease-out]">
          Veuillez saisir correctement votre adresse e-mail et votre mot de passe
          pour accéder à la console d’administration.
        </p>

        <div className="w-full animate-[login-rise_1s_ease-out]">
          <LoginForm />
        </div>

        <p
          className="mt-8 text-center text-sm text-neutral-400"
          title="Contactez un administrateur pour réinitialiser votre mot de passe"
        >
          Mot de passe oublié&nbsp;?
        </p>
      </main>
    </div>
  );
}
