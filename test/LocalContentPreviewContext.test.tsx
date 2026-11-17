import React from "react";

import {
  act,
  render,
  waitFor,
} from "@testing-library/react-native";

import {
  LocalContentPreviewProvider,
  useLocalContentLivePage,
} from "../src/template/editor/context/LocalContentPreviewContext";

import type {
  EditorContentPage,
} from "../src/template/editor/model/editorTypes";

type AuthState = {
  api: {
    isLoggedIn: boolean;
    isLoggingOut: boolean;
  };
};

const authState: AuthState = {
  api: {
    isLoggedIn: true,
    isLoggingOut: false,
  },
};

jest.mock(
  "../src/template/state/api/apiSlice",
  () => ({
    selectIsLoggedIn: (state: AuthState) =>
      state.api.isLoggedIn,
    selectIsLoggingOut: (state: AuthState) =>
      state.api.isLoggingOut,
  }),
);

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({
    useAppSelector: (selector: (state: AuthState) => unknown) =>
      selector(authState),
  }),
);

jest.mock(
  "../src/template/editor/hooks/useLocalContentPagePreview",
  () => ({
    useLocalContentPagePreview: () => ({
      status: "disabled",
      roots: [],
      pages: [],
    }),
  }),
);

const page = {
  id: "page:guide",
  title: "Anleitung",
  blocks: [],
} as EditorContentPage;

let currentLivePage: ReturnType<typeof useLocalContentLivePage>;

function Reader() {
  currentLivePage = useLocalContentLivePage();
  return null;
}

describe("LocalContentPreviewProvider", () => {
  beforeEach(() => {
    authState.api.isLoggedIn = true;
    authState.api.isLoggingOut = false;
  });

  it("keeps the live page setter stable within one session", () => {
    const view = render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    const originalSetter = currentLivePage.setLivePage;

    act(() => {
      originalSetter(page);
    });

    expect(currentLivePage.livePage).toEqual(page);
    expect(currentLivePage.setLivePage).toBe(originalSetter);

    act(() => {
      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    expect(currentLivePage.setLivePage).toBe(originalSetter);
    expect(currentLivePage.livePage).toEqual(page);
  });
  it("provides temporary live pages while logged in", () => {
    render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    act(() => {
      currentLivePage.setLivePage(page);
    });

    expect(currentLivePage.livePage).toEqual(page);
  });

  it("hides and clears the live page during logout", async () => {
    const view = render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    act(() => {
      currentLivePage.setLivePage(page);
    });

    expect(currentLivePage.livePage).toEqual(page);

    act(() => {
      authState.api.isLoggingOut = true;
      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    expect(currentLivePage.livePage).toBeNull();

    await waitFor(() => {
      expect(currentLivePage.livePage).toBeNull();
    });
  });

  it("rejects live page updates while logged out", () => {
    authState.api.isLoggedIn = false;

    render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    act(() => {
      currentLivePage.setLivePage(page);
    });

    expect(currentLivePage.livePage).toBeNull();
  });

  it("rejects an old setter after logout and re-login", () => {
    const view = render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    const oldSetter = currentLivePage.setLivePage;

    act(() => {
      authState.api.isLoggingOut = true;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    expect(currentLivePage.livePage).toBeNull();

    act(() => {
      authState.api.isLoggedIn = false;
      authState.api.isLoggingOut = false;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    act(() => {
      authState.api.isLoggedIn = true;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    act(() => {
      oldSetter(page);
    });

    expect(currentLivePage.livePage).toBeNull();
  });
  it("supports functional live page updates", () => {
    render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    act(() => {
      currentLivePage.setLivePage(page);
    });

    let previousPage: EditorContentPage | null = null;

    act(() => {
      currentLivePage.setLivePage(previous => {
        previousPage = previous;

        return {
          ...page,
          title: "Aktualisierte Anleitung",
        };
      });
    });

    expect(previousPage).toEqual(page);
    expect(currentLivePage.livePage?.title)
      .toBe("Aktualisierte Anleitung");
  });

  it("rejects stale functional updates after re-login", () => {
    const view = render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    const oldSetter = currentLivePage.setLivePage;
    const updater = jest.fn(() => page);

    act(() => {
      authState.api.isLoggingOut = true;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    act(() => {
      authState.api.isLoggedIn = false;
      authState.api.isLoggingOut = false;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    act(() => {
      authState.api.isLoggedIn = true;

      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    act(() => {
      oldSetter(updater);
    });

    expect(updater).not.toHaveBeenCalled();
    expect(currentLivePage.livePage).toBeNull();
  });
  it("does not restore the old page after a new login", () => {
    const view = render(
      <LocalContentPreviewProvider>
        <Reader />
      </LocalContentPreviewProvider>,
    );

    act(() => {
      currentLivePage.setLivePage(page);
    });

    act(() => {
      authState.api.isLoggedIn = false;
      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    expect(currentLivePage.livePage).toBeNull();

    act(() => {
      authState.api.isLoggedIn = true;
      view.rerender(
        <LocalContentPreviewProvider>
          <Reader />
        </LocalContentPreviewProvider>,
      );
    });

    expect(currentLivePage.livePage).toBeNull();
  });
});