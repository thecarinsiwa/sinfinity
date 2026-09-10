"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import type { Country, CreateCountryInput, UpdateCountryInput } from "@/lib/settings";

type FormState = {
  code: string;
  code3: string;
  name: string;
  phoneCode: string;
};

const EMPTY: FormState = { code: "", code3: "", name: "", phoneCode: "" };

function toForm(country: Country): FormState {
  return {
    code: country.code,
    code3: country.code3 ?? "",
    name: country.name,
    phoneCode: country.phoneCode ?? "",
  };
}

function canSubmit(form: FormState): boolean {
  return form.code.trim().length === 2 && form.name.trim().length > 0;
}

export type CountryFormProps = {
  formId: string;
  /** `null` = création ; objet = édition */
  country: Country | null;
  onSuccess: (saved: Country) => void;
  onSavingChange?: (saving: boolean) => void;
  onCanSubmitChange?: (ready: boolean) => void;
  disabled?: boolean;
};

export function CountryForm({
  formId,
  country,
  onSuccess,
  onSavingChange,
  onCanSubmitChange,
  disabled = false,
}: CountryFormProps) {
  const t = useTranslations("settings.countries");
  const tc = useTranslations("common");
  const isEdit = country !== null;
  const [form, setForm] = useState<FormState>(() =>
    country ? toForm(country) : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(country ? toForm(country) : EMPTY);
    setError(null);
  }, [country]);

  useEffect(() => {
    onCanSubmitChange?.(canSubmit(form));
  }, [form, onCanSubmitChange]);

  function setSavingState(value: boolean) {
    setSaving(value);
    onSavingChange?.(value);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit(form)) return;

    setSavingState(true);
    setError(null);

    const payload: CreateCountryInput | UpdateCountryInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      code3: form.code3.trim() ? form.code3.trim().toUpperCase() : undefined,
      phoneCode: form.phoneCode.trim() || undefined,
    };

    try {
      const saved =
        isEdit && country
          ? await apiFetch<Country>(`/countries/${country.id}`, {
              method: "PATCH",
              body: payload,
            })
          : await apiFetch<Country>("/countries", {
              method: "POST",
              body: payload,
            });
      onSuccess(saved);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : tc("saveFailed"),
      );
    } finally {
      setSavingState(false);
    }
  }

  const fieldsDisabled = disabled || saving;

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2"
    >
      {error ? (
        <p className="text-sm text-danger sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t("formCode")}</span>
        <Input
          required
          maxLength={2}
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          disabled={fieldsDisabled}
          placeholder="CD"
          className="uppercase"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t("formCode3")}</span>
        <Input
          maxLength={3}
          value={form.code3}
          onChange={(e) => setForm((f) => ({ ...f, code3: e.target.value }))}
          disabled={fieldsDisabled}
          placeholder="COD"
          className="uppercase"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">{t("formName")}</span>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          disabled={fieldsDisabled}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">{t("formPhone")}</span>
        <Input
          value={form.phoneCode}
          onChange={(e) =>
            setForm((f) => ({ ...f, phoneCode: e.target.value }))
          }
          disabled={fieldsDisabled}
          placeholder="+243"
        />
      </label>
    </form>
  );
}
