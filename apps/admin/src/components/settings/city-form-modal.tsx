"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  City,
  Country,
  CreateCityInput,
  UpdateCityInput,
} from "@/lib/settings";

type FormState = {
  countryId: string;
  name: string;
  region: string;
};

type CityFormModalProps = {
  open: boolean;
  city: City | null;
  countries: Country[];
  defaultCountryId: string;
  onClose: () => void;
  onSaved: () => void;
};

export function CityFormModal({
  open,
  city,
  countries,
  defaultCountryId,
  onClose,
  onSaved,
}: CityFormModalProps) {
  const t = useTranslations("settings.cities");
  const tc = useTranslations("common");
  const isEdit = city !== null;
  const [form, setForm] = useState<FormState>({
    countryId: "",
    name: "",
    region: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      city
        ? {
            countryId: city.countryId,
            name: city.name,
            region: city.region ?? "",
          }
        : {
            countryId: defaultCountryId,
            name: "",
            region: "",
          },
    );
    setError(null);
  }, [open, city, defaultCountryId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateCityInput | UpdateCityInput = {
      countryId: form.countryId,
      name: form.name.trim(),
      region: form.region.trim() ? form.region.trim() : null,
    };

    try {
      if (isEdit && city) {
        await apiFetch<City>(`/cities/${city.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<City>("/cities", { method: "POST", body: payload });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : tc("saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("edit") : t("new")}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            form="city-form"
            disabled={saving || !form.countryId || !form.name.trim()}
          >
            {saving ? tc("saving") : isEdit ? tc("save") : tc("create")}
          </Button>
        </>
      }
    >
      <form id="city-form" onSubmit={onSubmit} className="flex flex-col gap-3">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formCountry")}</span>
          <Select
            required
            value={form.countryId}
            onChange={(e) => setForm((f) => ({ ...f, countryId: e.target.value }))}
            disabled={saving}
          >
            <option value="">{tc("noneOption")}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formName")}</span>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formRegion")}</span>
          <Input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            disabled={saving}
          />
        </label>
      </form>
    </Modal>
  );
}
