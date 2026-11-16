import { createBackendTextFromStoreV2 } from "../src/template/editor/adapters/createBackendTextFromStoreV2";
import { selectBackendContentWriteContext } from "../src/template/editor/adapters/updateBackendContentElementFromStore";

// Only isolate HTML sanitization for these adapter-level tests.
// Sanitizer security is covered by its own existing test suites.
jest.mock(
  "../src/template/editor/utils/sanitizeContentHtml",
  () => ({
    sanitizeContentHtml: (html: string) => html,
  }),
);

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({
    selectBackendContentWriteContext: jest.fn(),
  }),
);

const mockedContext = jest.mocked(selectBackendContentWriteContext);

describe("createBackendTextFromStoreV2 - sichere Erstellung", () => {
  let create: jest.Mock;
  let get: jest.Mock;

  let activeClient: {
    createContentElement: jest.Mock;
    getContentElement: jest.Mock;
  };

  let session: {
    isLoggedIn: boolean;
    canEdit: boolean;
    isSwitchingServer: boolean;
    isLoggingOut: boolean;
    server: string;
    authGeneration: number;
  };

  const getState = () =>
    ({
      api: {
        dynamic_content_api_v2: {
          defaultApi: activeClient,
        },
      },
    }) as any;

  const save = (html = "<p>Hallo</p>", position = 1) =>
    createBackendTextFromStoreV2({
      menuId: 10003,
      position,
      html,
      getState,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    session = {
      isLoggedIn: true,
      canEdit: true,
      isSwitchingServer: false,
      isLoggingOut: false,
      server: "https://test.invalid",
      authGeneration: 1,
    };

    create = jest.fn(async () => ({
      data: { elementId: 20106 },
    }));

    get = jest.fn(async (id: number) => ({
      data: {
        abstractSiteContentType: "SiteContentText",
        uniqueContentId: id,
        mimeType: "text/html",
        text: create.mock.calls[0][0].content.text,
      },
    }));

    activeClient = {
      createContentElement: create,
      getContentElement: get,
    };

    mockedContext.mockImplementation(
      () => ({ ...session, client: activeClient }) as any,
    );
  });

  test("speichert und verifiziert die Backend-ID", async () => {
    await expect(save()).resolves.toBe(20106);

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(20106);

    const request = create.mock.calls[0][0];

    expect(request.menuId).toBe(10003);
    expect(request.position).toBe(1);
    expect(request.content.mimeType).toBe("text/html");
    expect(request.content.editable).toBe(true);
    expect(request.content.uniqueContentId).toBeUndefined();
    expect(request.content.text).toBe("<p>Hallo</p>");
  });

  test("leerer Text fuehrt zu keinem POST", async () => {
    await expect(save("<p> </p>")).rejects.toThrow();

    expect(create).not.toHaveBeenCalled();
  });

  test("Position 0 ist ungueltig", async () => {
    await expect(save("<p>Hallo</p>", 0)).rejects.toThrow();

    expect(create).not.toHaveBeenCalled();
  });

  test("ohne Editor-Berechtigung kein POST", async () => {
    session.canEdit = false;

    await expect(save()).rejects.toThrow();

    expect(create).not.toHaveBeenCalled();
  });

  test("ohne Anmeldung kein POST", async () => {
    session.isLoggedIn = false;

    await expect(save()).rejects.toThrow();

    expect(create).not.toHaveBeenCalled();
  });

  test("waehrend Serverwechsel kein POST", async () => {
    session.isSwitchingServer = true;

    await expect(save()).rejects.toThrow();

    expect(create).not.toHaveBeenCalled();
  });

  test("Sitzungswechsel nach POST verhindert das Nachladen", async () => {
    create.mockImplementationOnce(async () => {
      session.authGeneration += 1;
      return { data: { elementId: 20106 } };
    });

    await expect(save()).rejects.toThrow();

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
  });

  test("ungueltige Server-ID wird abgelehnt", async () => {
    create.mockResolvedValueOnce({
      data: { elementId: 0 },
    });

    await expect(save()).rejects.toThrow();

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
  });

  test("abweichender Serverinhalt wird erkannt", async () => {
    get.mockResolvedValueOnce({
      data: {
        abstractSiteContentType: "SiteContentText",
        uniqueContentId: 20106,
        mimeType: "text/html",
        text: "<p>Anderer Inhalt</p>",
      },
    });

    await expect(save()).rejects.toThrow();

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });

  test("Netzwerkfehler fuehrt zu keiner automatischen Wiederholung", async () => {
    create.mockRejectedValueOnce(new Error("Netzwerkfehler"));

    await expect(save()).rejects.toThrow("Netzwerkfehler");

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
  });

  test("Serverwechsel nach POST wird erkannt", async () => {
    create.mockImplementationOnce(async () => {
      session.server = "https://anderer-server.invalid";
      return { data: { elementId: 20106 } };
    });

    await expect(save()).rejects.toThrow();

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
  });

  test("unterschiedliche MIME-Typen werden erkannt", async () => {
    get.mockResolvedValueOnce({
      data: {
        abstractSiteContentType: "SiteContentText",
        uniqueContentId: 20106,
        mimeType: "text/plain",
        text: "<p>Hallo</p>",
      },
    });

    await expect(save()).rejects.toThrow();

    expect(create).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });
});