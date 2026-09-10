"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import {
  UNIT_TYPE_LABELS,
  UNIT_TYPES,
  type CreateUnitInput,
  type Unit,
  type UnitType,
  type UpdateUnitInput,
} from "@/lib/settings";

type FormState = {
  code: string;
  name: string;
  symbol: string;
  unitType: UnitType;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  symbol: "",
  unitType: "count",
};

type UnitFormModalProps = {
  open: boolean;
  unit: Unit | null;
  onClose: () => void;
  onSaved: () => void;
};

export function UnitFormModal({
  open,
  unit,
  onClose,
  onSaved,
}: UnitFormModalProps) {
  const isEdit = unit !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      unit
        ? {
            code: unit.code,
            name: unit.name,
            symbol: unit.symbol ?? "",
            unitType: unit.unitType,
          }
        : EMPTY,
    );
    setError(null);
  }, [open, unit]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateUnitInput | UpdateUnitInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim() || null,
      unitType: form.unitType,
    };

    try {
      if (isEdit && unit) {
        await apiFetch<Unit>(`/units/${unit.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Unit>("/units", {
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
      title={isEdit ? "Modifier l'unité" : "Nouvelle unité"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="unit-form"
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code</span>
          <Input
            required
            maxLength={32}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            placeholder="PCS"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <Select
            required
            value={form.unitType}
            onChange={(e) =>
              setForm((f) => ({ ...f, unitType: e.target.value as UnitType }))
            }
            disabled={saving}
          >
            {UNIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {UNIT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Nom</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Pièce"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Symbole (optionnel)</span>
          <Input
            maxLength={32}
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            disabled={saving}
            placeholder="pc"
          />
        </label>
      </form>
    </Modal>
  );
}
