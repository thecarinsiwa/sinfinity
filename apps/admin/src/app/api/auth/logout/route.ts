import { logoutCurrentSession } from "@/lib/auth/session";

export async function POST(): Promise<Response> {
  await logoutCurrentSession();
  return new Response(null, { status: 204 });
}
