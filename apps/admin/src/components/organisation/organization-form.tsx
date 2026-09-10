"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import type {
  Organization,
  UpdateOrganizationInput,
} from "@/lib/organisation";

type CurrencyOption = {
  id: string;
  code: string;
  name: string;
};

type CountryOption = {
  id: string;
  code: string;
  name: string;
};

type FormState = {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  defaultCurrencyId: string;
  countryId: string;
  isActive: boolean;
};

function toFormState(org: Organization): FormState {
  return {
    name: org.name ?? "",
    legalName: org.legalName ?? "",
    taxId: org.taxId ?? "",
    email: org.email ?? "",
    phone: org.phone ?? "",
    website: org.website ?? "",
    logoUrl: org.logoUrl ?? "",
    defaultCurrencyId: org.defaultCurrencyId ?? "",
    countryId: org.countryId ?? "",
    isActive: org.isActive,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function OrganizationForm() {
  const { user, hasPermission, refreshSession } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("organizations.write");
  const canReadSettings = hasPermission("settings.read");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [settingsStub, setSettingsStub] = useState(false);

  const organizationId = user?.organizationId;

  const load = useCallback(async () => {
    if (!organizationId) {
      setLoadError("Organisation introuvable pour cet utilisateur.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const org = await apiFetch<Organization>(
        `/organizations/${organizationId}`,
      );
      setForm(toFormState(org));

      if (canReadSettings) {
        try {
          const [currencyPage, countryPage] = await Promise.all([
            apiFetch<PaginatedResponse<CurrencyOption>>(
              "/currencies?page=1&pageSize=100&isActive=true",
            ),
            apiFetch<PaginatedResponse<CountryOption>>(
              "/countries?page=1&pageSize=100",
            ),
          ]);
          setCurrencies(currencyPage.data);
          setCountries(countryPage.data);
          setSettingsStub(false);
        } catch {
          setCurrencies([]);
          setCountries([]);
          setSettingsStub(true);
        }
      } else {
        setSettingsStub(true);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Impossible de charger l’organisation";
      setLoadError(message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, canReadSettings]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId || !form || !canWrite) {
      return;
    }

    setSaving(true);
    try {
      const body: UpdateOrganizationInput = {
        name: form.name.trim(),
        legalName: emptyToNull(form.legalName),
        taxId: emptyToNull(form.taxId),
        email: emptyToNull(form.email),
        phone: emptyToNull(form.phone),
        website: emptyToNull(form.website),
        logoUrl: emptyToNull(form.logoUrl),
        defaultCurrencyId: emptyToNull(form.defaultCurrencyId),
        countryId: emptyToNull(form.countryId),
        isActive: form.isActive,
      };

      const updated = await apiFetch<Organization>(
        `/organizations/${organizationId}`,
        { method: "PATCH", body },
      );
      setForm(toFormState(updated));
      await refreshSession();
      toast({
        title: "Organisation enregistrée",
        tone: "success",
      });
    } catch (error) {
      toast({
        title: "Échec de l’enregistrement",
        description:
          error instanceof ApiError
            ? error.message
            : "Une erreur est survenue",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Chargement de l’organisation…" />
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <Alert tone="danger" title="Erreur">
        {loadError ?? "Données indisponibles"}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      {!canWrite ? (
        <Alert tone="info" title="Lecture seule">
          Vous n’avez pas la permission organizations.write.
        </Alert>
      ) : null}

      {settingsStub ? (
        <Alert tone="warning" title="Référentiels limités">
          {canReadSettings
            ? "Impossible de charger devises/pays — saisie UUID en secours."
            : "Permission settings.read absente — saisie UUID en secours pour devise et pays."}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="Raison sociale">
          <Input
            value={form.legalName}
            onChange={(e) => updateField("legalName", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="NIF / Tax ID">
          <Input
            value={form.taxId}
            onChange={(e) => updateField("taxId", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="Téléphone">
          <Input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="Site web">
          <Input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label="URL du logo" className="sm:col-span-2">
          <Input
            value={form.logoUrl}
            onChange={(e) => updateField("logoUrl", e.target.value)}
            disabled={!canWrite || saving}
            placeholder="https://…"
          />
        </Field>

        <Field label="Devise par défaut">
          {!settingsStub && currencies.length > 0 ? (
            <Select
              value={form.defaultCurrencyId}
              onChange={(e) => updateField("defaultCurrencyId", e.target.value)}
              disabled={!canWrite || saving}
            >
              <option value="">— Aucune —</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} — {currency.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={form.defaultCurrencyId}
              onChange={(e) => updateField("defaultCurrencyId", e.target.value)}
              disabled={!canWrite || saving}
              placeholder="UUID devise"
              className="font-mono text-xs"
            />
          )}
        </Field>

        <Field label="Pays">
          {!settingsStub && countries.length > 0 ? (
            <Select
              value={form.countryId}
              onChange={(e) => updateField("countryId", e.target.value)}
              disabled={!canWrite || saving}
            >
              <option value="">— Aucun —</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.code} — {country.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={form.countryId}
              onChange={(e) => updateField("countryId", e.target.value)}
              disabled={!canWrite || saving}
              placeholder="UUID pays"
              className="font-mono text-xs"
            />
          )}
        </Field>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            disabled={!canWrite || saving}
          />
          <span>Organisation active</span>
        </label>
      </div>

      <Can permission="organizations.write">
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Can>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className ?? ""}`}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
