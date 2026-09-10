"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
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

type CountryFormModalProps = {
  open: boolean;
  country: Country | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CountryFormModal({
  open,
  country,
  onClose,
  onSaved,
}: CountryFormModalProps) {
  const isEdit = country !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(country ? toForm(country) : EMPTY);
    setError(null);
  }, [open, country]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateCountryInput | UpdateCountryInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      code3: form.code3.trim() ? form.code3.trim().toUpperCase() : undefined,
      phoneCode: form.phoneCode.trim() || undefined,
    };

    try {
      if (isEdit && country) {
        await apiFetch<Country>(`/countries/${country.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Country>("/countries", { method: "POST", body: payload });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Enregistrement impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le pays" : "Nouveau pays"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="country-form"
            disabled={saving || form.code.trim().length !== 2 || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="country-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code ISO (2)</span>
          <Input
            required
            maxLength={2}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            placeholder="CD"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code ISO (3)</span>
          <Input
            maxLength={3}
            value={form.code3}
            onChange={(e) => setForm((f) => ({ ...f, code3: e.target.value }))}
            disabled={saving}
            placeholder="COD"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Nom</span>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Indicatif téléphone</span>
          <Input
            value={form.phoneCode}
            onChange={(e) => setForm((f) => ({ ...f, phoneCode: e.target.value }))}
            disabled={saving}
            placeholder="+243"
          />
        </label>
      </form>
    </Modal>
  );
}
