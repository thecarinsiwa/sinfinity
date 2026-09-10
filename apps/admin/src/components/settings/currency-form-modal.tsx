"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateCurrencyInput,
  Currency,
  UpdateCurrencyInput,
} from "@/lib/settings";

type FormState = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  symbol: "",
  decimalPlaces: "2",
  isActive: true,
};

type CurrencyFormModalProps = {
  open: boolean;
  currency: Currency | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CurrencyFormModal({
  open,
  currency,
  onClose,
  onSaved,
}: CurrencyFormModalProps) {
  const isEdit = currency !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      currency
        ? {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            decimalPlaces: String(currency.decimalPlaces),
            isActive: currency.isActive,
          }
        : EMPTY,
    );
    setError(null);
  }, [open, currency]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const decimals = Number.parseInt(form.decimalPlaces, 10);
    if (Number.isNaN(decimals) || decimals < 0 || decimals > 8) {
      setError("Les décimales doivent être un entier entre 0 et 8");
      setSaving(false);
      return;
    }

    const payload: CreateCurrencyInput | UpdateCurrencyInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      decimalPlaces: decimals,
      isActive: form.isActive,
    };

    try {
      if (isEdit && currency) {
        await apiFetch<Currency>(`/currencies/${currency.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Currency>("/currencies", {
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
      title={isEdit ? "Modifier la devise" : "Nouvelle devise"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="currency-form"
            disabled={
              saving ||
              form.code.trim().length !== 3 ||
              !form.name.trim() ||
              !form.symbol.trim()
            }
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="currency-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code ISO 4217</span>
          <Input
            required
            maxLength={3}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            placeholder="USD"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Symbole</span>
          <Input
            required
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            disabled={saving}
            placeholder="$"
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Décimales</span>
          <Input
            type="number"
            min={0}
            max={8}
            value={form.decimalPlaces}
            onChange={(e) =>
              setForm((f) => ({ ...f, decimalPlaces: e.target.value }))
            }
            disabled={saving}
          />
        </label>
        <label className="flex items-center gap-2 text-sm self-end pb-2">
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
