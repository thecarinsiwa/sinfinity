import { getAuthCookies } from "@/lib/auth/cookies";
import { jsonError, nestFetch } from "@/lib/auth/nest";
import { refreshAuthTokens } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "cookie",
  "content-length",
  "authorization",
]);

async function proxyRequest(
  request: Request,
  pathSegments: string[],
): Promise<Response> {
  const nestPath = `/${pathSegments.map(encodeURIComponent).join("/")}`;
  const url = new URL(request.url);
  const targetPath = `${nestPath}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let { accessToken } = await getAuthCookies();

  if (!accessToken) {
    const refreshed = await refreshAuthTokens();
    if (!refreshed) {
      return jsonError(401, null, "Not authenticated");
    }
    accessToken = (await getAuthCookies()).accessToken;
  }

  if (!accessToken) {
    return jsonError(401, null, "Not authenticated");
  }

  let result = await nestFetch<unknown>(targetPath, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    accessToken,
  });

  if (!result.ok && result.status === 401) {
    const refreshed = await refreshAuthTokens();
    if (!refreshed) {
      return jsonError(401, result.body, "Session expired");
    }
    accessToken = (await getAuthCookies()).accessToken;
    if (!accessToken) {
      return jsonError(401, result.body, "Session expired");
    }
    result = await nestFetch<unknown>(targetPath, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      accessToken,
    });
  }

  if (!result.ok) {
    if (result.body) {
      return Response.json(result.body, { status: result.status });
    }
    return new Response(result.rawText, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (result.status === 204) {
    return new Response(null, { status: 204 });
  }

  return Response.json(result.data, { status: result.status });
}

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
