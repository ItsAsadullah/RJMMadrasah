import { createClient } from "@supabase/supabase-js";
import { updateStudentStatus } from "./updateStudentStatus";
import type { StudentStatus } from "./studentStatus";

function clientWithResponse(body: unknown, status = 200) {
  const fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  }));
  const db = createClient("https://test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch },
  });
  return { db, fetch };
}

describe("student status updates", () => {
  it.each(["inactive", "active"] as const)("saves %s for only the selected students and requests verification", async status => {
    const { db, fetch } = clientWithResponse([{ id: "one", status }, { id: "two", status }]);
    const result = await updateStudentStatus(db, ["one", "two", "one"], status);
    expect(result.complete).toBe(true);
    expect(result.updated).toHaveLength(2);
    const [url, request] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/rest/v1/students");
    expect(parsed.searchParams.get("id")).toBe('in.(one,two)');
    expect(parsed.searchParams.get("select")).toBe("id,status");
    expect(request.method).toBe("PATCH");
    expect(JSON.parse(request.body)).toEqual({ status });
  });

  it("does not report success when row access is denied silently", async () => {
    const { db } = clientWithResponse([]);
    expect(await updateStudentStatus(db, ["one"], "inactive")).toEqual({ updated: [], complete: false });
  });

  it("reports partial saves so the UI can reflect only persisted changes", async () => {
    const { db } = clientWithResponse([{ id: "one", status: "inactive" }]);
    expect(await updateStudentStatus(db, ["one", "two"], "inactive")).toEqual({
      updated: [{ id: "one", status: "inactive" }], complete: false,
    });
  });

  it("rejects a database failure", async () => {
    const { db } = clientWithResponse({ code: "42501", message: "permission denied" }, 403);
    await expect(updateStudentStatus(db, ["one"], "inactive")).rejects.toMatchObject({ code: "42501" });
  });

  it("does not write for an empty selection or invalid status", async () => {
    const { db, fetch } = clientWithResponse([]);
    await expect(updateStudentStatus(db, [], "inactive")).resolves.toEqual({ updated: [], complete: true });
    await expect(updateStudentStatus(db, ["one"], "unknown" as StudentStatus)).rejects.toThrow("Invalid student status");
    expect(fetch).not.toHaveBeenCalled();
  });
});
