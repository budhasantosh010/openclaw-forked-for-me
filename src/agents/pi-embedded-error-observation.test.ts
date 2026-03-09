import { describe, expect, it } from "vitest";
import {
  buildApiErrorObservationFields,
  buildTextObservationFields,
} from "./pi-embedded-error-observation.js";

describe("buildApiErrorObservationFields", () => {
  it("redacts request ids and exposes stable hashes instead of raw payloads", () => {
    const observed = buildApiErrorObservationFields(
      '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"},"request_id":"req_overload"}',
    );

    expect(observed).toMatchObject({
      rawErrorPreview: expect.stringContaining('"request_id":"sha256:'),
      rawErrorHash: expect.stringMatching(/^sha256:/),
      rawErrorFingerprint: expect.stringMatching(/^sha256:/),
      providerErrorType: "overloaded_error",
      providerErrorMessagePreview: "Overloaded",
      requestIdHash: expect.stringMatching(/^sha256:/),
    });
    expect(observed.rawErrorPreview).not.toContain("req_overload");
  });

  it("forces token redaction for observation previews", () => {
    const observed = buildApiErrorObservationFields(
      "Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz123456",
    );

    expect(observed.rawErrorPreview).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(observed.rawErrorPreview).toContain("sk-abc");
    expect(observed.rawErrorHash).toMatch(/^sha256:/);
  });

  it("builds sanitized generic text observation fields", () => {
    const observed = buildTextObservationFields(
      '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"},"request_id":"req_prev"}',
    );

    expect(observed).toMatchObject({
      textPreview: expect.stringContaining('"request_id":"sha256:'),
      textHash: expect.stringMatching(/^sha256:/),
      textFingerprint: expect.stringMatching(/^sha256:/),
      providerErrorType: "overloaded_error",
      providerErrorMessagePreview: "Overloaded",
      requestIdHash: expect.stringMatching(/^sha256:/),
    });
    expect(observed.textPreview).not.toContain("req_prev");
  });
});
