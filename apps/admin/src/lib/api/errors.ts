import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly messages: string[];
  readonly body: ApiErrorBody | null;

  constructor(statusCode: number, body: ApiErrorBody | null, fallbackMessage?: string) {
    const messages = normalizeMessages(body?.message, fallbackMessage);
    super(messages.join("; ") || `HTTP ${statusCode}`);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = body?.error ?? "Error";
    this.messages = messages;
    this.body = body;
  }
}

function normalizeMessages(
  message: string | string[] | undefined,
  fallback?: string,
): string[] {
  if (Array.isArray(message)) {
    return message.filter((item) => item.trim().length > 0);
  }
  if (typeof message === "string" && message.trim().length > 0) {
    return [message];
  }
  if (fallback && fallback.trim().length > 0) {
    return [fallback];
  }
  return [];
}

export function parseApiErrorBody(value: unknown): ApiErrorBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const statusCode = record.statusCode;
  const error = record.error;
  const message = record.message;

  if (typeof statusCode !== "number" || typeof error !== "string") {
    return null;
  }

  if (typeof message !== "string" && !Array.isArray(message)) {
    return null;
  }

  if (Array.isArray(message) && !message.every((item) => typeof item === "string")) {
    return null;
  }

  return {
    statusCode,
    message: message as string | string[],
    error,
  };
}
