"use client";

import { useTranslations } from "next-intl";
import type { Document } from "@/lib/documents";
import { Button, Drawer } from "@/components/ui";

type DocumentDetailDrawerProps = {
  open: boolean;
  document: Document | null;
  typeLabel?: string;
  onClose: () => void;
};

export function DocumentDetailDrawer({
  open,
  document: doc,
  typeLabel,
  onClose,
}: DocumentDetailDrawerProps) {
  const t = useTranslations("documents.detail");
  const tStatus = useTranslations("documents.status");
  const tCommon = useTranslations("common");

  function formatBytes(size: number | null): string {
    if (size == null) return tCommon("emDash");
    if (size < 1024) return t("bytes", { n: size });
    if (size < 1024 * 1024) {
      return t("kb", { n: (size / 1024).toFixed(1) });
    }
    return t("mb", { n: (size / (1024 * 1024)).toFixed(1) });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("title")}
      footer={
        <Button variant="secondary" type="button" onClick={onClose}>
          {t("close")}
        </Button>
      }
    >
      {doc ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">{t("titleField")}</dt>
          <dd>{doc.title}</dd>
          <dt className="text-muted">{t("fileName")}</dt>
          <dd className="font-mono text-xs break-all">{doc.fileName}</dd>
          <dt className="text-muted">{t("typeId")}</dt>
          <dd>
            {typeLabel ?? doc.documentTypeId ?? tCommon("emDash")}
          </dd>
          <dt className="text-muted">{t("status")}</dt>
          <dd>
            {doc.status === "active" ||
            doc.status === "archived" ||
            doc.status === "deleted"
              ? tStatus(doc.status)
              : doc.status}
          </dd>
          <dt className="text-muted">{t("mimeType")}</dt>
          <dd className="font-mono text-xs">
            {doc.mimeType ?? tCommon("emDash")}
          </dd>
          <dt className="text-muted">{t("size")}</dt>
          <dd>{formatBytes(doc.fileSize)}</dd>
          <dt className="text-muted">{t("uploadedBy")}</dt>
          <dd className="font-mono text-xs break-all">
            {doc.uploadedBy ?? tCommon("emDash")}
          </dd>
          <dt className="text-muted">{t("createdAt")}</dt>
          <dd className="font-mono text-xs">
            {doc.createdAt.slice(0, 19).replace("T", " ")}
          </dd>
          <dt className="text-muted">{t("url")}</dt>
          <dd className="font-mono text-xs break-all text-muted">
            {doc.fileUrl}
          </dd>
          <dt className="text-muted">{t("checksum")}</dt>
          <dd className="font-mono text-xs break-all text-muted">
            {doc.checksum ?? tCommon("emDash")}
          </dd>
        </dl>
      ) : null}
    </Drawer>
  );
}
