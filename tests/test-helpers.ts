import { vi } from "vitest";
import { createTestHarness, type TestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";

interface RecordedRequest {
  readonly init: RequestInit | undefined;
  readonly url: string;
}

const defaultConfig = {
  apiBaseUrl: "https://api.twexapi.io",
  apiKeySecretRef: "X_API_SCRAPER_KEY",
  defaultTimelineCount: 15,
  defaultUserSearchCount: 10,
  defaultTrendCount: 5,
};

function createHarness(config: Record<string, unknown> = defaultConfig): TestHarness {
  return createTestHarness({
    manifest,
    config,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function useResponses(responses: readonly Response[]): RecordedRequest[] {
  const remaining = [...responses];
  const requests: RecordedRequest[] = [];

  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const response = remaining.shift();
      if (response === undefined) {
        throw new Error("Test response queue is empty. Add a stub response.");
      }
      requests.push({ init, url: String(input) });
      return response;
    },
  );

  return requests;
}

export { createHarness, defaultConfig, jsonResponse, useResponses };
export type { RecordedRequest };
