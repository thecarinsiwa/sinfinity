import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ComingSoonPage } from "@/components/layout/coming-soon";

/** Stub temporaire — remplacé par le CRUD de la ressource. */
export async function SettingsResourceStub({ title }: { title: string }) {
  const t = await getTranslations("settings");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <Link
          href="/parametres"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>
      </p>
      <ComingSoonPage title={title} />
    </div>
  );
}
