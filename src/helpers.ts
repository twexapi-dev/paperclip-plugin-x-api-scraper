import type { PluginContext, ToolResult } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_TIMELINE_COUNT,
  DEFAULT_TREND_COUNT,
  DEFAULT_USER_SEARCH_COUNT,
} from "./constants.js";

type ToolParams = Record<string, unknown>;

interface TwexApiConfig {
  readonly apiBaseUrl?: string;
  readonly apiKeySecretRef?: string;
  readonly defaultTimelineCount?: number;
  readonly defaultUserSearchCount?: number;
  readonly defaultTrendCount?: number;
}

interface ResolvedConfig {
  readonly apiBaseUrl: string;
  readonly apiKeySecretRef: string;
  readonly defaultTimelineCount: number;
  readonly defaultUserSearchCount: number;
  readonly defaultTrendCount: number;
}

function asString(params: ToolParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(params: ToolParams, key: string): string[] {
  const value = params[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function asInteger(
  params: ToolParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = params[key];
  const value = typeof raw === "number" ? raw : Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeBaseUrl(value: unknown): string {
  const raw =
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/u, "");
}

function normalizeConfig(raw: Record<string, unknown>): ResolvedConfig {
  const config = raw as TwexApiConfig;
  return {
    apiBaseUrl: normalizeBaseUrl(config.apiBaseUrl),
    apiKeySecretRef:
      typeof config.apiKeySecretRef === "string"
        ? config.apiKeySecretRef.trim()
        : "",
    defaultTimelineCount: asInteger(
      raw,
      "defaultTimelineCount",
      DEFAULT_TIMELINE_COUNT,
      1,
      100,
    ),
    defaultUserSearchCount: asInteger(
      raw,
      "defaultUserSearchCount",
      DEFAULT_USER_SEARCH_COUNT,
      1,
      100,
    ),
    defaultTrendCount: asInteger(
      raw,
      "defaultTrendCount",
      DEFAULT_TREND_COUNT,
      1,
      100,
    ),
  };
}

async function getConfig(ctx: PluginContext): Promise<ResolvedConfig> {
  return normalizeConfig(await ctx.config.get());
}

function errorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.msg ?? record.error;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  if (typeof body === "string" && body.trim().length > 0) {
    return body.slice(0, 240);
  }
  return "Request failed. Check the request and retry.";
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function resolveApiKey(ctx: PluginContext): Promise<string> {
  const config = await getConfig(ctx);
  if (!config.apiKeySecretRef) {
    throw new Error(
      "TwexAPI API key is not configured. Add apiKeySecretRef.",
    );
  }
  return ctx.secrets.resolve(config.apiKeySecretRef);
}

async function twexApiRequest(
  ctx: PluginContext,
  method: "GET" | "POST",
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  } = {},
): Promise<unknown> {
  const config = await getConfig(ctx);
  const apiKey = await resolveApiKey(ctx);
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await ctx.http.fetch(url.toString(), {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(options.body ?? {}) } : {}),
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    throw new Error(
      `TwexAPI request failed with status ${response.status}: ${errorMessage(body)}`,
    );
  }
  return body;
}

function requireString(params: ToolParams, key: string): string | ToolResult {
  const value = asString(params, key);
  if (value !== undefined) return value;
  return { error: `${key} is required. Add ${key} and retry.` };
}

function requirePathSegment(
  params: ToolParams,
  key: string,
): string | ToolResult {
  const value = requireString(params, key);
  if (typeof value !== "string") return value;
  if (value === "." || value === "..") {
    return { error: `${key} cannot be "." or "..". Enter a valid value.` };
  }
  return value;
}

function stripHandle(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

function countLabel(count: number | undefined, noun: string): string {
  return `${count ?? 0} ${noun}${count === 1 ? "" : "s"}`;
}

function arrayCount(data: unknown, key: string): number | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const value = (data as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.length : undefined;
}

function pageSuffix(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const record = data as Record<string, unknown>;
  return record.has_next_page === true || typeof record.next_cursor === "string"
    ? " More results are available."
    : "";
}

export {
  arrayCount,
  asInteger,
  asString,
  asStringArray,
  countLabel,
  errorMessage,
  getConfig,
  normalizeConfig,
  pageSuffix,
  requirePathSegment,
  requireString,
  stripHandle,
  twexApiRequest,
};

export type { ResolvedConfig, ToolParams };
