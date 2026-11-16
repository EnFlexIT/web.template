import backendRolesReducer from "../src/template/state/authorization/backendRolesSlice";
import groupRolesReducer from "../src/template/state/authorization/groupRolesSlice";

const rotate = {
  type: "api/rotateJwtLocal",
  payload: "renewed-token",
};

describe("JWT rotation without role refresh", () => {
  it("preserves verified backend roles and selected preview", () => {
    const before = {
      ...backendRolesReducer(undefined, { type: "@@INIT" }),
      status: "ready" as const,
      roles: ["USER", "EDITOR"],
      selectedPreviewRole: "EDITOR",
    };

    expect(backendRolesReducer(before, rotate)).toEqual(before);
  });

  it("preserves group roles and group selection", () => {
    const before = {
      ...groupRolesReducer(undefined, { type: "@@INIT" }),
      status: "ready" as const,
      roles: ["TEAM"],
      selectedGroupRole: "TEAM",
    };

    expect(groupRolesReducer(before, rotate)).toEqual(before);
  });
});