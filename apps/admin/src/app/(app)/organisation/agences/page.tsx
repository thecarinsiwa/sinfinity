import { BranchesPanel } from "@/components/organisation/branches-panel";

export default function AgencesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Agences
        </h1>
        <p className="mt-1 text-sm text-muted">
          Bureaux, entrepôts et sites mixtes de l’organisation.
        </p>
      </div>
      <BranchesPanel />
    </div>
  );
}
