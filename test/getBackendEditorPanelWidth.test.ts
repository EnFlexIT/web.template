import {
  getBackendEditorPanelWidth,
} from "../src/template/editor/layout/getBackendEditorPanelWidth";

describe("Backend editor responsive panel width", () => {
  it("uses 35 percent on large desktop screens", () => {
    expect(getBackendEditorPanelWidth(1920)).toBe("35%");
    expect(getBackendEditorPanelWidth(1500)).toBe("35%");
  });

  it("uses 50 percent on medium screens", () => {
    expect(getBackendEditorPanelWidth(1499)).toBe("50%");
    expect(getBackendEditorPanelWidth(900)).toBe("50%");
  });

  it("preserves the current width on narrow screens", () => {
    expect(getBackendEditorPanelWidth(899)).toBe(460);
    expect(getBackendEditorPanelWidth(600)).toBe(460);
  });
});