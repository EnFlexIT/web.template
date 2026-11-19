import {
  clearRoleSelection,
  getRoleSelectionIdentity,
  readRoleSelection,
  saveRoleSelection,
} from "@/template/state/authorization/roleSelectionStorage";

const STORAGE_KEY = "web-template:unified-role-selection:v1";

function createJwt(subject: string): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return [
    encode({ alg: "none", typ: "JWT" }),
    encode({ sub: subject }),
    "signature",
  ].join(".");
}

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      values.delete(key);
    }),
    clear: jest.fn(() => {
      values.clear();
    }),
  };
}

describe("roleSelectionStorage", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );

  let storage: ReturnType<typeof createStorage>;

  const session = {
    server: "https://server-a.example",
    authenticationMethod: "jwt",
    jwt: createJwt("user-a"),
  };

  beforeEach(() => {
    storage = createStorage();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage },
    });
  });

  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("derives a user-specific session identity", () => {
    const first = getRoleSelectionIdentity(session);

    const second = getRoleSelectionIdentity({
      ...session,
      jwt: createJwt("user-b"),
    });

    expect(first).not.toBeNull();
    expect(first).not.toBe(second);
  });

  it("does not create an identity without a valid subject", () => {
    expect(
      getRoleSelectionIdentity({
        ...session,
        jwt: null,
      }),
    ).toBeNull();

    expect(
      getRoleSelectionIdentity({
        ...session,
        jwt: "invalid-token",
      }),
    ).toBeNull();
  });

  it("stores and restores a backend role", () => {
    const identity = getRoleSelectionIdentity(session);

    saveRoleSelection(identity, {
      backendRole: "EDITOR",
    });

    expect(readRoleSelection(identity)).toMatchObject({
      backendRole: "EDITOR",
      groupRole: null,
    });
  });

  it("preserves the backend role when changing the group", () => {
    const identity = getRoleSelectionIdentity(session);

    saveRoleSelection(identity, {
      backendRole: "EDITOR",
    });

    saveRoleSelection(identity, {
      groupRole: "Vermieter",
    });

    expect(readRoleSelection(identity)).toMatchObject({
      backendRole: "EDITOR",
      groupRole: "Vermieter",
    });
  });

  it("does not restore another user's selection", () => {
    const first = getRoleSelectionIdentity(session);

    const second = getRoleSelectionIdentity({
      ...session,
      jwt: createJwt("user-b"),
    });

    saveRoleSelection(first, {
      backendRole: "ADMIN",
      groupRole: "Vermieter",
    });

    expect(readRoleSelection(second)).toBeNull();
  });

  it("does not restore a selection from another server", () => {
    const first = getRoleSelectionIdentity(session);

    const second = getRoleSelectionIdentity({
      ...session,
      server: "https://server-b.example",
    });

    saveRoleSelection(first, {
      backendRole: "EDITOR",
    });

    expect(readRoleSelection(second)).toBeNull();
  });

  it("rejects invalid stored roles", () => {
    const identity = getRoleSelectionIdentity(session);

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        identity,
        backendRole: "SUPER_ADMIN",
        groupRole: "Vermieter",
      }),
    );

    expect(readRoleSelection(identity)).toBeNull();
  });

  it("clears the stored selection", () => {
    const identity = getRoleSelectionIdentity(session);

    saveRoleSelection(identity, {
      backendRole: "EDITOR",
    });

    clearRoleSelection();

    expect(readRoleSelection(identity)).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
