"use client";

import type { Document, DocumentStatus } from "@/lib/documents";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents";
import { Button, Drawer } from "@/components/ui";

type DocumentDetailDrawerProps = {
  open: boolean;
  document: Document | null;
  typeLabel?: string;
  onClose: () => void;
};

function formatBytes(size: number | null): string {
  if (size == null) return "—";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentDetailDrawer({
  open,
  document: doc,
  typeLabel,
  onClose,
}: DocumentDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Détail document"
      footer={
        <Button variant="secondary" type="button" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {doc ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Titre</dt>
          <dd>{doc.title}</dd>
          <dt className="text-muted">Fichier</dt>
          <dd className="font-mono text-xs break-all">{doc.fileName}</dd>
          <dt className="text-muted">Type</dt>
          <dd>{typeLabel ?? doc.documentTypeId ?? "—"}</dd>
          <dt className="text-muted">Statut</dt>
          <dd>
            {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] ?? doc.status}
          </dd>
          <dt className="text-muted">MIME</dt>
          <dd className="font-mono text-xs">{doc.mimeType ?? "—"}</dd>
          <dt className="text-muted">Taille</dt>
          <dd>{formatBytes(doc.fileSize)}</dd>
          <dt className="text-muted">Uploadé par</dt>
          <dd className="font-mono text-xs break-all">
            {doc.uploadedBy ?? "—"}
          </dd>
          <dt className="text-muted">Créé</dt>
          <dd className="font-mono text-xs">
            {doc.createdAt.slice(0, 19).replace("T", " ")}
          </dd>
          <dt className="text-muted">Clé stockage</dt>
          <dd className="font-mono text-xs break-all text-muted">
            {doc.fileUrl}
          </dd>
          <dt className="text-muted">Checksum</dt>
          <dd className="font-mono text-xs break-all text-muted">
            {doc.checksum ?? "—"}
          </dd>
        </dl>
      ) : null}
    </Drawer>
  );
}
