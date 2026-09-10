"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("organisation");
  const tCommon = useTranslations("common");
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
      setLoadError(t("form.loadFailed"));
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
        error instanceof ApiError ? error.message : t("form.loadFailed");
      setLoadError(message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, canReadSettings, t]);

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
        title: t("form.toastSaved"),
        tone: "success",
      });
    } catch (error) {
      toast({
        title: t("form.saveFailed"),
        description:
          error instanceof ApiError
            ? error.message
            : tCommon("genericError"),
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label={t("form.loading")} />
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <Alert tone="danger" title={tCommon("error")}>
        {loadError ?? t("form.loadFailed")}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      {!canWrite ? (
        <Alert tone="info" title={tCommon("readonly")}>
          {t("form.readonlyBanner")}
        </Alert>
      ) : null}

      {settingsStub ? (
        <Alert tone="warning">{t("form.limitedRefs")}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.name")}>
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.legalName")}>
          <Input
            value={form.legalName}
            onChange={(e) => updateField("legalName", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.taxId")}>
          <Input
            value={form.taxId}
            onChange={(e) => updateField("taxId", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.email")}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.phone")}>
          <Input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.website")}>
          <Input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            disabled={!canWrite || saving}
          />
        </Field>
        <Field label={t("form.logoUrl")} className="sm:col-span-2">
          <Input
            value={form.logoUrl}
            onChange={(e) => updateField("logoUrl", e.target.value)}
            disabled={!canWrite || saving}
            placeholder="https://…"
          />
        </Field>

        <Field label={t("form.currency")}>
          {!settingsStub && currencies.length > 0 ? (
            <Select
              value={form.defaultCurrencyId}
              onChange={(e) => updateField("defaultCurrencyId", e.target.value)}
              disabled={!canWrite || saving}
            >
              <option value="">{tCommon("noneOptionF")}</option>
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
              placeholder="UUID"
              className="font-mono text-xs"
            />
          )}
        </Field>

        <Field label={t("form.country")}>
          {!settingsStub && countries.length > 0 ? (
            <Select
              value={form.countryId}
              onChange={(e) => updateField("countryId", e.target.value)}
              disabled={!canWrite || saving}
            >
              <option value="">{tCommon("noneOption")}</option>
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
              placeholder="UUID"
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
          <span>{t("form.active")}</span>
        </label>
      </div>

      <Can permission="organizations.write">
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? t("form.saving") : t("form.save")}
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
