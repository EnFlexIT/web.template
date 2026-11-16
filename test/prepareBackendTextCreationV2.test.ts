import {
  prepareBackendTextCreationV2,
} from "../src/template/editor/adapters/prepareBackendTextCreationV2";

describe("prepareBackendTextCreationV2", () => {
  const valid = {
    menuId: 10003,
    position: 1,
    html: "<p>Neuer Text</p>",
  };

  it("prepares a valid local HTML draft", () => {
    expect(prepareBackendTextCreationV2(valid)).toEqual(valid);
  });

  it("rejects invalid backend menu IDs", () => {
    for (const menuId of [0, -1, 1.5, NaN]) {
      expect(() =>
        prepareBackendTextCreationV2({ ...valid, menuId }),
      ).toThrow("Invalid backend menu ID");
    }
  });

  it("rejects invalid positions", () => {
    for (const position of [0, -1, 1.5, NaN]) {
      expect(() =>
        prepareBackendTextCreationV2({ ...valid, position }),
      ).toThrow("Invalid content position");
    }
  });

  it("rejects empty HTML drafts", () => {
    for (const html of ["", " ", "\n"]) {
      expect(() =>
        prepareBackendTextCreationV2({ ...valid, html }),
      ).toThrow("HTML content must not be empty");
    }
  });

  it("trims surrounding whitespace without changing HTML", () => {
    expect(
      prepareBackendTextCreationV2({
        ...valid,
        html: "  <h2>Hallo</h2>  ",
      }).html,
    ).toBe("<h2>Hallo</h2>");
  });
});