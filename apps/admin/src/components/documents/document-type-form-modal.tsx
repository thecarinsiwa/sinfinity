"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateDocumentTypeInput,
  DocumentType,
  UpdateDocumentTypeInput,
} from "@/lib/documents";

type FormState = {
  code: string;
  name: string;
  mimeText: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  mimeText: "application/pdf",
};

function mimeLinesToArray(text: string): string[] | null {
  const lines = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : null;
}

function mimeArrayToText(mimes: string[] | null): string {
  return mimes?.length ? mimes.join("\n") : "";
}

type DocumentTypeFormModalProps = {
  open: boolean;
  documentType: DocumentType | null;
  onClose: () => void;
  onSaved: () => void;
};

export function DocumentTypeFormModal({
  open,
  documentType,
  onClose,
  onSaved,
}: DocumentTypeFormModalProps) {
  const t = useTranslations("documents.types");
  const tCommon = useTranslations("common");
  const isEdit = documentType !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      documentType
        ? {
            code: documentType.code,
            name: documentType.name,
            mimeText: mimeArrayToText(documentType.allowedMimeTypes),
          }
        : EMPTY,
    );
    setError(null);
  }, [open, documentType]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const allowedMimeTypes = mimeLinesToArray(form.mimeText);

    try {
      if (isEdit && documentType) {
        const payload: UpdateDocumentTypeInput = {
          name: form.name.trim(),
          allowedMimeTypes,
        };
        await apiFetch<DocumentType>(`/document-types/${documentType.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        const payload: CreateDocumentTypeInput = {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          allowedMimeTypes,
        };
        await apiFetch<DocumentType>("/document-types", {
          method: "POST",
          body: payload,
        });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : tCommon("saveFailed"),
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
      className="max-w-xl"
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            form="document-type-form"
            disabled={
              saving ||
              !form.name.trim() ||
              (!isEdit && !form.code.trim())
            }
          >
            {saving
              ? tCommon("saving")
              : isEdit
                ? tCommon("save")
                : tCommon("create")}
          </Button>
        </>
      }
    >
      <form
        id="document-type-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-3"
      >
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formCode")}</span>
          <Input
            required={!isEdit}
            maxLength={64}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving || isEdit}
            placeholder="QUOTE"
            className="uppercase font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formName")}</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Devis"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formMime")}</span>
          <Textarea
            rows={5}
            value={form.mimeText}
            onChange={(e) =>
              setForm((f) => ({ ...f, mimeText: e.target.value }))
            }
            disabled={saving}
            className="font-mono text-xs"
            placeholder={"application/pdf\nimage/png"}
            spellCheck={false}
          />
          <span className="text-xs text-muted">{t("formMimeHelp")}</span>
        </label>
      </form>
    </Modal>
  );
}
