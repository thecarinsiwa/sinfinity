import { SystemSettingsPanel } from "@/components/systeme/system-settings-panel";

export default function SystemePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Système
        </h1>
        <p className="mt-1 text-sm text-muted">
          Paramètres système organisation (clé / JSON) et outils techniques.
        </p>
      </div>
      <SystemSettingsPanel />
    </div>
  );
}
