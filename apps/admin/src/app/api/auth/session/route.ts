import { jsonError } from "@/lib/auth/nest";
import { loadSession } from "@/lib/auth/session";

export async function GET(): Promise<Response> {
  const result = await loadSession();
  if (!result.ok) {
    return jsonError(result.status, result.body, "Not authenticated");
  }
  return Response.json(result.data);
}
