export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 font-sans">
      <main className="flex w-full max-w-lg flex-col gap-6 text-center sm:text-left">
        <p className="text-sm font-medium tracking-wide text-teal-800 uppercase">
          Console d’administration
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Sinfinity Admin
        </h1>
        <p className="text-lg leading-8 text-zinc-600">
          Paramétrage, organisation, utilisateurs et référentiels. L’UI métier
          reste sur Web&nbsp;; le point de vente sur POS.
        </p>
        <p className="text-sm text-zinc-500">
          API attendue sur{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-800">
            {process.env.NEXT_PUBLIC_API_URL ??
              "http://localhost:4000/api/v1"}
          </code>
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="text-sm">
            <a
              href="/dev/ui"
              className="font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              Showcase UI
            </a>
          </p>
        ) : null}
      </main>
    </div>
  );
}
