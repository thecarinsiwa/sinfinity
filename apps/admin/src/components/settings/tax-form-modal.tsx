"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import {
  isDecimalString,
  TAX_TYPE_LABELS,
  TAX_TYPES,
  type Country,
  type CreateTaxInput,
  type Tax,
  type TaxType,
  type UpdateTaxInput,
} from "@/lib/settings";

type FormState = {
  code: string;
  name: string;
  rate: string;
  taxType: TaxType;
  countryId: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  rate: "",
  taxType: "vat",
  countryId: "",
  isActive: true,
};

type TaxFormModalProps = {
  open: boolean;
  tax: Tax | null;
  countries: Country[];
  onClose: () => void;
  onSaved: () => void;
};

export function TaxFormModal({
  open,
  tax,
  countries,
  onClose,
  onSaved,
}: TaxFormModalProps) {
  const isEdit = tax !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      tax
        ? {
            code: tax.code,
            name: tax.name,
            rate: tax.rate,
            taxType: tax.taxType,
            countryId: tax.countryId ?? "",
            isActive: tax.isActive,
          }
        : EMPTY,
    );
    setError(null);
  }, [open, tax]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const rateValue = form.rate.trim();
    if (!isDecimalString(rateValue)) {
      setError("Le taux doit être un nombre décimal (string), ex. 16.0000");
      setSaving(false);
      return;
    }

    const payload: CreateTaxInput | UpdateTaxInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      rate: rateValue,
      taxType: form.taxType,
      countryId: form.countryId || null,
      isActive: form.isActive,
    };

    try {
      if (isEdit && tax) {
        await apiFetch<Tax>(`/taxes/${tax.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Tax>("/taxes", {
          method: "POST",
          body: payload,
        });
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
      title={isEdit ? "Modifier la taxe" : "Nouvelle taxe"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="tax-form"
            disabled={
              saving ||
              !form.code.trim() ||
              !form.name.trim() ||
              !form.rate.trim()
            }
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="tax-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code</span>
          <Input
            required
            maxLength={64}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            className="uppercase"
            placeholder="TVA16"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <Select
            required
            value={form.taxType}
            onChange={(e) =>
              setForm((f) => ({ ...f, taxType: e.target.value as TaxType }))
            }
            disabled={saving}
          >
            {TAX_TYPES.map((t) => (
              <option key={t} value={t}>
                {TAX_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Libellé</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="TVA RDC 16%"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Taux % (decimal string)</span>
          <Input
            required
            inputMode="decimal"
            value={form.rate}
            onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            disabled={saving}
            placeholder="16.0000"
            className="font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Pays (optionnel)</span>
          <Select
            value={form.countryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, countryId: e.target.value }))
            }
            disabled={saving}
          >
            <option value="">— Global —</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox
            checked={form.isActive}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.checked }))
            }
            disabled={saving}
          />
          <span>Active</span>
        </label>
      </form>
    </Modal>
  );
}
