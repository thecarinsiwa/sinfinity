"use client";

import { useTranslations } from "next-intl";
import { stringifyJsonPretty, type AuditLog } from "@/lib/ops";
import { Button, Drawer } from "@/components/ui";

type AuditLogDetailDrawerProps = {
  open: boolean;
  log: AuditLog | null;
  onClose: () => void;
};

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  const empty = value == null;
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-surface-muted p-3 font-mono text-xs leading-relaxed text-foreground">
        {empty ? "null" : stringifyJsonPretty(value)}
      </pre>
    </div>
  );
}

export function AuditLogDetailDrawer({
  open,
  log,
  onClose,
}: AuditLogDetailDrawerProps) {
  const t = useTranslations("audit.detail");
  const tLogin = useTranslations("audit.loginLogs");
  const tCommon = useTranslations("common");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("title")}
      className="max-w-xl"
      footer={
        <Button variant="secondary" type="button" onClick={onClose}>
          {t("close")}
        </Button>
      }
    >
      {log ? (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted">{t("createdAt")}</dt>
            <dd className="font-mono text-xs">
              {log.createdAt.slice(0, 19).replace("T", " ")}
            </dd>
            <dt className="text-muted">{t("userId")}</dt>
            <dd className="font-mono text-xs break-all">
              {log.userId ?? tCommon("emDash")}
            </dd>
            <dt className="text-muted">{t("action")}</dt>
            <dd>{log.action}</dd>
            <dt className="text-muted">{t("entityType")}</dt>
            <dd>
              <span className="font-mono text-xs">{log.entityType}</span>
              {log.entityId ? (
                <span className="mt-0.5 block font-mono text-xs text-muted break-all">
                  {log.entityId}
                </span>
              ) : null}
            </dd>
            <dt className="text-muted">{tLogin("ip")}</dt>
            <dd className="font-mono text-xs">
              {log.ipAddress ?? tCommon("emDash")}
            </dd>
          </dl>
          <JsonBlock label={t("oldValues")} value={log.oldValues} />
          <JsonBlock label={t("newValues")} value={log.newValues} />
        </div>
      ) : null}
    </Drawer>
  );
}
