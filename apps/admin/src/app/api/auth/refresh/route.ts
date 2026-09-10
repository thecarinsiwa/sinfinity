import { jsonError } from "@/lib/auth/nest";
import { refreshAuthTokens } from "@/lib/auth/session";

export async function POST(): Promise<Response> {
  const ok = await refreshAuthTokens();
  if (!ok) {
    return jsonError(401, null, "Unable to refresh session");
  }
  return Response.json({ ok: true });
}
