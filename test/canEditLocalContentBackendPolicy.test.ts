import { canEditLocalContent } from "../src/template/editor/authorization/canEditLocalContent";

describe("content editor permission", () => {
  it("allows EDITOR", () => {
    expect(canEditLocalContent(["EDITOR"])).toBe(true);
  });

  it("allows ADMIN only when EDITOR is also present", () => {
    expect(canEditLocalContent(["ADMIN", "EDITOR"])).toBe(true);
  });

  it("rejects ADMIN alone", () => {
    expect(canEditLocalContent(["ADMIN"])).toBe(false);
  });

  it("rejects application-specific roles without EDITOR", () => {
    expect(canEditLocalContent(["Vermieter"])).toBe(false);
  });

  it("rejects empty or missing roles", () => {
    expect(canEditLocalContent([])).toBe(false);
    expect(canEditLocalContent(null)).toBe(false);
  });
});
