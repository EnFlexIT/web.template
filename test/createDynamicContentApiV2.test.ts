import { Configuration as LegacyConfiguration } from "../src/api/implementation/Dynamic-Content-Api";
import { createDynamicContentApiV2 } from "../src/template/state/api/createDynamicContentApiV2";

type TestClient = {
  basePath: string;
  configuration: {
    basePath?: string;
    baseOptions?: {
      withCredentials?: boolean;
      headers?: Record<string, string>;
    };
  };
};

function inspectClient(
  client: ReturnType<typeof createDynamicContentApiV2>,
): TestClient {
  return client as unknown as TestClient;
}

describe("createDynamicContentApiV2", () => {
  it("preserves the configured backend URL", () => {
    const client = inspectClient(
      createDynamicContentApiV2(
        new LegacyConfiguration({
          basePath: "https://test.example/dc",
        }),
      ),
    );

    expect(client.basePath).toBe("https://test.example/dc");
  });

  it("preserves JWT authorization and cookies", () => {
    const client = inspectClient(
      createDynamicContentApiV2(
        new LegacyConfiguration({
          basePath: "https://test.example/dc",
          baseOptions: {
            withCredentials: true,
            headers: {
              Authorization: "Bearer test-token",
            },
          },
        }),
      ),
    );

    expect(client.configuration.baseOptions?.withCredentials).toBe(true);
    expect(client.configuration.baseOptions?.headers?.Authorization)
      .toBe("Bearer test-token");
  });

  it("does not introduce JWT headers for cookie-only sessions", () => {
    const client = inspectClient(
      createDynamicContentApiV2(
        new LegacyConfiguration({
          basePath: "https://test.example/dc",
          baseOptions: {
            withCredentials: true,
          },
        }),
      ),
    );

    expect(client.configuration.baseOptions?.withCredentials).toBe(true);
    expect(client.configuration.baseOptions?.headers?.Authorization)
      .toBeUndefined();
  });

  it("creates independent clients for different servers", () => {
    const first = inspectClient(
      createDynamicContentApiV2(
        new LegacyConfiguration({
          basePath: "https://server-a.example/dc",
        }),
      ),
    );

    const second = inspectClient(
      createDynamicContentApiV2(
        new LegacyConfiguration({
          basePath: "https://server-b.example/dc",
        }),
      ),
    );

    expect(first).not.toBe(second);
    expect(first.basePath).toBe("https://server-a.example/dc");
    expect(second.basePath).toBe("https://server-b.example/dc");
  });
});