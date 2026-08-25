// SPDX-FileCopyrightText: 2026 TwexAPI Contributors
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { afterEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import { createHarness, jsonResponse, useResponses } from "./test-helpers.js";

describe("TwexAPI Paperclip plugin fuzz properties", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps every generated tweet ID in the lookup request body", async () => {
    expect.assertions(1);
    let requestCount = 0;

    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 80 })
          .filter((value) => value.trim().length > 0)
          .filter((value) => value.trim() !== "." && value.trim() !== ".."),
        async (id) => {
          const requests = useResponses([jsonResponse([{ tweet_id: id.trim() }])]);
          const harness = createHarness();
          await plugin.definition.setup(harness.ctx);

          await harness.executeTool(TOOL_NAMES.lookupTweet, { id });

          assert.equal(requests.length, 1);
          const requestedUrl = new URL(requests[0]?.url ?? "");
          assert.equal(requestedUrl.origin, "https://api.twexapi.io");
          assert.equal(requestedUrl.pathname, "/v2/tweet/detail");
          assert.equal(requestedUrl.search, "");
          assert.equal(requests[0]?.init?.method, "POST");
          assert.deepEqual(
            JSON.parse(String(requests[0]?.init?.body ?? "[]")),
            [id.trim()],
          );
          requestCount += 1;
        },
      ),
      { numRuns: 100 },
    );

    for (const id of [".", "..", " . ", " .. "]) {
      const harness = createHarness();
      await plugin.definition.setup(harness.ctx);
      const output = await harness.executeTool(TOOL_NAMES.lookupTweet, { id });
      assert.equal(
        output.error,
        'id cannot be "." or "..". Enter a valid value.',
      );
    }

    expect(requestCount).toBe(100);
  });
});
