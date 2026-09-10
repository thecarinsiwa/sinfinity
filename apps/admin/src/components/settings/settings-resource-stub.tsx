import { ComingSoonPage } from "@/components/layout/coming-soon";

/** Stub temporaire — remplacé par le CRUD de la ressource. */
export function SettingsResourceStub({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <a
          href="/parametres"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Paramètres
        </a>
      </p>
      <ComingSoonPage title={title} />
    </div>
  );
}
