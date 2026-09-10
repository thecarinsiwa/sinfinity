import type { Metadata } from "next";
import { ForbiddenView } from "@/components/auth/forbidden-view";

export const metadata: Metadata = {
  title: "Accès refusé — Sinfinity Admin",
};

export default function ForbiddenPage() {
  return <ForbiddenView />;
}
