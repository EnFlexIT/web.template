import {
  normalizeBackendMenus,
} from "@/template/state/navigation/adapters/normalizeBackendMenus";

describe("normalizeBackendMenus", () => {
  it("reads the current menuList response", () => {
    const result = normalizeBackendMenus({
      menuList: [
        {
          menuId: 100,
          parentId: null,
          isHeadMenu: true,
          position: 1,
          caption: "Root",
        },
        {
          menuId: 101,
          parentId: 100,
          isHeadMenu: false,
          position: 1,
          caption: "Child",
        },
      ],
    });

    expect(result).toEqual([
      {
        menuID: 100,
        parentID: undefined,
        position: 1,
        caption: "Root",
        Screen: undefined,
      },
      {
        menuID: 101,
        parentID: 100,
        position: 1,
        caption: "Child",
        Screen: undefined,
      },
    ]);
  });

  it("supports legacy menu field names", () => {
    const result = normalizeBackendMenus({
      menuList: [
        {
          menuID: 200,
          parentID: null,
          position: 1,
          caption: "Legacy",
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].menuID).toBe(200);
    expect(result[0].parentID).toBeUndefined();
  });

  it("supports the older array response", () => {
    const result = normalizeBackendMenus([
      {
        menuID: 300,
        position: 1,
        caption: "Array Menu",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].menuID).toBe(300);
  });

  it("rejects invalid and duplicate menu entries", () => {
    const result = normalizeBackendMenus({
      menuList: [
        {
          menuId: 400,
          position: 1,
          caption: "Valid",
        },
        {
          menuId: 400,
          position: 2,
          caption: "Duplicate",
        },
        {
          menuId: -1,
          position: 1,
          caption: "Invalid ID",
        },
        {
          menuId: 401,
          parentId: 401,
          position: 1,
          caption: "Self Parent",
        },
        {
          menuId: 402,
          position: 1,
          caption: "",
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].menuID).toBe(400);
  });

  it("rejects malformed responses", () => {
    expect(normalizeBackendMenus(null)).toEqual([]);
    expect(normalizeBackendMenus({})).toEqual([]);
    expect(normalizeBackendMenus("invalid")).toEqual([]);
  });

  it("does not invent missing menu IDs", () => {
    const result = normalizeBackendMenus({
      menuList: [
        {
          position: 1,
          caption: "No ID",
        },
      ],
    });

    expect(result).toEqual([]);
  });
});
