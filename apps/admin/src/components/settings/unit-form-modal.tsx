"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import {
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
  const t = useTranslations("settings.units");
  const tc = useTranslations("common");
  const tUnitTypes = useTranslations("settings.unitTypes");
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
            form="unit-form"
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? tc("saving") : isEdit ? tc("save") : tc("create")}
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
          <span className="font-medium">{t("formCode")}</span>
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
          <span className="font-medium">{t("formType")}</span>
          <Select
            required
            value={form.unitType}
            onChange={(e) =>
              setForm((f) => ({ ...f, unitType: e.target.value as UnitType }))
            }
            disabled={saving}
          >
            {UNIT_TYPES.map((type) => (
              <option key={type} value={type}>
                {tUnitTypes(type)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">{t("formName")}</span>
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
          <span className="font-medium">
            {tc("optional", { label: t("formSymbol") })}
          </span>
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
