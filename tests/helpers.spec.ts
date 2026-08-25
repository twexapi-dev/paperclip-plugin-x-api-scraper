import { describe, expect, it } from "vitest";
import {
  countLabel,
  errorMessage,
  normalizeConfig,
  pageSuffix,
  requirePathSegment,
  stripHandle,
} from "../src/helpers.js";

describe("TwexAPI Paperclip plugin helpers", () => {
  it("normalizes config defaults and clamps counts", () => {
    expect(
      normalizeConfig({
        apiBaseUrl: " https://api.twexapi.test/// ",
        apiKeySecretRef: " key ",
        defaultTimelineCount: 1000,
        defaultUserSearchCount: "bad",
        defaultTrendCount: 0,
      }),
    ).toEqual({
      apiBaseUrl: "https://api.twexapi.test",
      apiKeySecretRef: "key",
      defaultTimelineCount: 100,
      defaultUserSearchCount: 20,
      defaultTrendCount: 1,
    });
  });

  it("rejects invalid path segments and strips handles", () => {
    expect(requirePathSegment({ screen_name: ".." }, "screen_name")).toEqual({
      error: 'screen_name cannot be "." or "..". Enter a valid value.',
    });
    expect(requirePathSegment({ screen_name: "." }, "screen_name")).toEqual({
      error: 'screen_name cannot be "." or "..". Enter a valid value.',
    });
    expect(stripHandle(" @alice ")).toBe("alice");
    expect(stripHandle("alice")).toBe("alice");
  });

  it("formats labels, page suffixes, and API errors", () => {
    expect(countLabel(1, "tweet")).toBe("1 tweet");
    expect(countLabel(2, "tweet")).toBe("2 tweets");
    expect(pageSuffix({ next_cursor: "abc" })).toBe(
      " More results are available.",
    );
    expect(pageSuffix({ has_next_page: true })).toBe(
      " More results are available.",
    );
    expect(pageSuffix(null)).toBe("");
    expect(errorMessage({ message: "bad request" })).toBe("bad request");
    expect(errorMessage({ msg: "   " })).toBe(
      "Request failed. Check the request and retry.",
    );
  });
});
