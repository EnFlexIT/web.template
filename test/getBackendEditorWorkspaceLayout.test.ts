import {
  getBackendEditorWorkspaceLayout,
} from "../src/template/editor/layout/getBackendEditorWorkspaceLayout";

describe("Backend editor mobile workspace", () => {
  it("uses tabs for authorized backend editors below 900px", () => {
    expect(
      getBackendEditorWorkspaceLayout(393, true, true),
    ).toBe("tabs");

    expect(
      getBackendEditorWorkspaceLayout(899, true, true),
    ).toBe("tabs");
  });

  it("preserves the split layout at desktop sizes", () => {
    expect(
      getBackendEditorWorkspaceLayout(900, true, true),
    ).toBe("split");

    expect(
      getBackendEditorWorkspaceLayout(1920, true, true),
    ).toBe("split");
  });

  it("does not show editor tabs to unauthorized users", () => {
    expect(
      getBackendEditorWorkspaceLayout(393, true, false),
    ).toBe("split");
  });

  it("does not affect unrelated screens", () => {
    expect(
      getBackendEditorWorkspaceLayout(393, false, true),
    ).toBe("split");
  });
});