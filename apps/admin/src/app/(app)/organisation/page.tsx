import { OrganizationForm } from "@/components/organisation/organization-form";

export default function OrganisationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Organisation
        </h1>
        <p className="mt-1 text-sm text-muted">
          Fiche du tenant courant — identité légale et paramètres de base.
        </p>
      </div>
      <OrganizationForm />
    </div>
  );
}
