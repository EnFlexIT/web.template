import reducer, {
  initialTemplateRolePreviewState,
  startTemplateRolePreview,
  setTemplatePreviewRole,
  stopTemplateRolePreview,
} from "../src/template/state/authorization/templateRolePreviewSlice";

describe("templateRolePreviewSlice", () => {
  it("starts disabled", () => {
    expect(reducer(undefined, { type: "@@INIT" }))
      .toEqual(initialTemplateRolePreviewState);
  });

  it("starts superAdmin in user perspective", () => {
    expect(reducer(undefined, startTemplateRolePreview("superAdmin")))
      .toEqual({
        enabled: true,
        actualRole: "superAdmin",
        selectedPreviewRole: "user",
      });
  });

  it("allows superAdmin to switch perspectives", () => {
    const started = reducer(
      undefined,
      startTemplateRolePreview("superAdmin"),
    );
    expect(
      reducer(started, setTemplatePreviewRole("frontendEditor"))
        .selectedPreviewRole,
    ).toBe("frontendEditor");
    expect(
      reducer(started, setTemplatePreviewRole("backendEditor"))
        .selectedPreviewRole,
    ).toBe("backendEditor");
  });

  it("rejects privilege escalation by a normal user", () => {
    const started = reducer(undefined, startTemplateRolePreview("user"));
    expect(
      reducer(started, setTemplatePreviewRole("frontendEditor"))
        .selectedPreviewRole,
    ).toBe("user");
  });

  it("does not grant frontend perspective to backendEditor", () => {
    const started = reducer(
      undefined,
      startTemplateRolePreview("backendEditor"),
    );
    expect(
      reducer(started, setTemplatePreviewRole("frontendEditor"))
        .selectedPreviewRole,
    ).toBe("backendEditor");
  });

  it("stops and resets the demo", () => {
    const started = reducer(
      undefined,
      startTemplateRolePreview("superAdmin"),
    );
    expect(reducer(started, stopTemplateRolePreview()))
      .toEqual(initialTemplateRolePreviewState);
  });

  it.each([
    "api/login/pending",
    "api/logoutLocal",
    "api/switchServer/pending",
    "api/setJwtLocal",
  ])("resets on %s", type => {
    const started = reducer(
      undefined,
      startTemplateRolePreview("superAdmin"),
    );
    expect(reducer(started, { type }))
      .toEqual(initialTemplateRolePreviewState);
  });
});