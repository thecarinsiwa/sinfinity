"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import {
  isSystemSettingKey,
  parseJsonSafe,
  stringifyJsonPretty,
  type SystemSetting,
  type UpsertSystemSettingInput,
} from "@/lib/ops";

type FormState = {
  key: string;
  description: string;
  jsonText: string;
};

const EMPTY: FormState = {
  key: "",
  description: "",
  jsonText: "{\n  \n}",
};

type SystemSettingFormModalProps = {
  open: boolean;
  setting: SystemSetting | null;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function SystemSettingFormModal({
  open,
  setting,
  readOnly = false,
  onClose,
  onSaved,
}: SystemSettingFormModalProps) {
  const isEdit = setting !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      setting
        ? {
            key: setting.key,
            description: setting.description ?? "",
            jsonText: stringifyJsonPretty(setting.value),
          }
        : EMPTY,
    );
    setError(null);
    setJsonError(null);
  }, [open, setting]);

  function validateJson(text: string): unknown | null {
    const parsed = parseJsonSafe(text);
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return null;
    }
    setJsonError(null);
    return parsed.value;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (readOnly) return;

    setSaving(true);
    setError(null);

    const key = form.key.trim();
    if (!isEdit && !isSystemSettingKey(key)) {
      setError(
        'La clé doit commencer par une lettre et ne contenir que lettres, chiffres, ".", "_" ou "-"',
      );
      setSaving(false);
      return;
    }

    const value = validateJson(form.jsonText);
    if (value === null) {
      setSaving(false);
      return;
    }

    const payload: UpsertSystemSettingInput = {
      value,
      description: form.description.trim() || null,
    };

    const targetKey = isEdit && setting ? setting.key : key;

    try {
      await apiFetch<SystemSetting>(
        `/system-settings/${encodeURIComponent(targetKey)}`,
        {
          method: "PUT",
          body: payload,
        },
      );
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

  const title = readOnly
    ? `Paramètre « ${setting?.key ?? ""} »`
    : isEdit
      ? `Modifier « ${setting?.key} »`
      : "Nouvelle clé";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-2xl"
      footer={
        readOnly ? (
          <Button variant="secondary" type="button" onClick={onClose}>
            Fermer
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="system-setting-form"
              disabled={
                saving ||
                (!isEdit && !form.key.trim()) ||
                !form.jsonText.trim() ||
                jsonError !== null
              }
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        )
      }
    >
      <form
        id="system-setting-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-3"
      >
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Clé</span>
          <Input
            required
            maxLength={128}
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            disabled={saving || isEdit || readOnly}
            placeholder="default_currency"
            className="font-mono"
            readOnly={readOnly}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Description (optionnel)</span>
          <Input
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            disabled={saving || readOnly}
            readOnly={readOnly}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Valeur JSON</span>
          <Textarea
            required={!readOnly}
            rows={12}
            value={form.jsonText}
            onChange={(e) => {
              setForm((f) => ({ ...f, jsonText: e.target.value }));
              setJsonError(null);
            }}
            onBlur={() => {
              if (!readOnly && form.jsonText.trim()) {
                validateJson(form.jsonText);
              }
            }}
            disabled={saving || readOnly}
            readOnly={readOnly}
            className="font-mono text-xs"
            spellCheck={false}
          />
          {!readOnly && jsonError ? (
            <span className="text-danger" role="alert">
              JSON invalide : {jsonError}
            </span>
          ) : null}
          {!readOnly && !jsonError ? (
            <span className="text-xs text-muted">
              Validé côté client avant envoi (parse JSON).
            </span>
          ) : null}
        </label>
      </form>
    </Modal>
  );
}
