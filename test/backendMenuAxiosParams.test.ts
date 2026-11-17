import axios, {
  type AxiosAdapter,
} from "axios";

import {
  Configuration,
  DefaultApi,
} from "../src/api/implementation/Dynamic-Content-Api";

describe("backend role-scoped menu HTTP request", () => {
  async function captureMenuUrl(
    role: string,
  ): Promise<string> {
    let capturedUrl: string | null = null;

    const adapter: AxiosAdapter = async (config) => {
      capturedUrl = axios.getUri(config);

      return {
        data: { menuList: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const api = new DefaultApi(
      new Configuration({
        basePath: "https://example.invalid/dc",
      }),
    );

    await api.menuGet("de", {
      params: {
        forRole: role,
      },
      adapter,
    });

    if (capturedUrl === null) {
      throw new Error("Axios adapter was not called");
    }

    return capturedUrl;
  }

  it("sends lang and the exact selected backend role", async () => {
    const url = new URL(
      await captureMenuUrl("Vermieter"),
    );

    expect(url.pathname).toBe("/dc/menu/");
    expect(url.searchParams.get("lang")).toBe("de");
    expect(url.searchParams.get("forRole")).toBe("Vermieter");
  });

  it("preserves special characters in role names", async () => {
    const role = "Rolle A&B";

    const url = new URL(
      await captureMenuUrl(role),
    );

    expect(url.searchParams.get("forRole")).toBe(role);
    expect(
      url.searchParams.getAll("forRole"),
    ).toEqual([role]);
  });
});
