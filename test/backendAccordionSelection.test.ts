import {
  getNextAccordionSelection,
} from "../src/template/editor/layout/backendAccordionSelection";

describe("Backend accordion selection", () => {
  it("opens a selected backend text block", () => {
    expect(getNextAccordionSelection(null, 20104)).toBe(20104);
  });

  it("closes a currently selected block", () => {
    expect(getNextAccordionSelection(20104, 20104)).toBeNull();
  });

  it("switches between blocks without selecting multiple", () => {
    expect(getNextAccordionSelection(20104, 20105)).toBe(20105);
  });

  it("ignores invalid backend IDs", () => {
    expect(getNextAccordionSelection(20104, 0)).toBe(20104);
    expect(getNextAccordionSelection(20104, -1)).toBe(20104);
  });
});