import { jsonError } from "@/lib/auth/nest";
import { loginWithPassword } from "@/lib/auth/session";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, null, "Invalid JSON body");
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return jsonError(400, null, "Email and password are required");
  }

  const result = await loginWithPassword(email, password);
  if (!result.ok) {
    return jsonError(
      result.status,
      result.body,
      "Invalid email or password",
    );
  }

  return Response.json({ ok: true });
}
