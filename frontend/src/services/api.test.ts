import { describe, it, expect, vi, afterEach } from "vitest";
import { api, streamingSummary, progress, rupees, statusLabel } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("workspace presentation", () => {
  it("computes actual completion without invented data", () => {
    expect(progress([])).toBe(0);
    expect(progress([{ status: "done" }, { status: "backlog" }])).toBe(50);
  });
  it("formats paise without losing budget scale", () => {
    expect(rupees(5000000)).toContain("50,000");
    expect(rupees(16666)).toContain("166.66");
  });
  it("labels workflow statuses", () =>
    expect(statusLabel("changes_requested")).toBe("Changes Requested"));
});
describe("API boundary", () => {
  it("includes same-origin credentials and validation header", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "real" }) });
    vi.stubGlobal("fetch", mock);
    expect(await api("projects", "POST", { name: "Test" })).toEqual({
      id: "real",
    });
    expect(mock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.objectContaining({ "X-HI-Request": "1" }),
        body: '{"name":"Test"}',
      }),
    );
  });
  it("surfaces authorization failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Workspace administrator required" }),
        }),
    );
    await expect(api("runs/id/review", "POST", {})).rejects.toThrow(
      "Workspace administrator required",
    );
  });
  it("reports unavailable backend clearly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw Error("html");
        },
      }),
    );
    await expect(api("me")).rejects.toThrow("Cannot reach the HI backend");
  });
});

describe("streamed drafts", () => {
  it("renders incomplete summary text safely", () => {
    expect(streamingSummary(JSON.stringify({ partial: '{"summary":"Hello ₹' }))).toBe("Hello ₹");
    expect(streamingSummary({ partial: '{"summary":"Line\\nnext' })).toBe("Line\nnext");
  });
  it("ignores final or malformed output", () => {
    expect(streamingSummary("invalid")).toBe("");
    expect(streamingSummary('{"summary":"Final"}')).toBe("");
  });
});
