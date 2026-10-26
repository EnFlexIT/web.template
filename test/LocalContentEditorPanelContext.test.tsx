import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import {
  LocalContentEditorPanelProvider,
  useLocalContentEditorPanel,
} from "@/template/editor/context/LocalContentEditorPanelContext";

import { useAppDispatch } from "@/template/state/store/useAppDispatch";
import { useAppSelector } from "@/template/state/store/useAppSelector";

jest.mock(
  "@/template/state/api/apiSlice",
  () => ({
    selectIsLoggedIn: (state: { api: { isLoggedIn: boolean } }) =>
      state.api.isLoggedIn,
  }),
);

jest.mock(
  "@/template/state/store/useAppDispatch",
  () => ({ useAppDispatch: jest.fn() }),
);

jest.mock(
  "@/template/state/store/useAppSelector",
  () => ({ useAppSelector: jest.fn() }),
);

type MockState = {
  api: {
    isLoggedIn: boolean;
  };
  authorization: {
    assignedRole: "USER" | "EDITOR" | "ADMIN";
    previewRole: "USER" | "EDITOR" | null;
  };
  developerConsole: {
    isOpen: boolean;
    placement: "bottom";
  };
};

const dispatch = jest.fn();

let state: MockState;

const mockedSelector = jest.mocked(useAppSelector);
const mockedDispatch = jest.mocked(useAppDispatch);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocalContentEditorPanelProvider>
    {children}
  </LocalContentEditorPanelProvider>
);

const createRequest = () => ({
  kind: "create" as const,
  parentId: "static:3900",
  mode: "page" as const,
});

describe("LocalContentEditorPanelProvider authorization lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    state = {
      api: { isLoggedIn: true },
      authorization: {
        assignedRole: "ADMIN",
        previewRole: null,
      },
      developerConsole: {
        isOpen: false,
        placement: "bottom",
      },
    };

    mockedDispatch.mockReturnValue(dispatch as never);

    mockedSelector.mockImplementation(
      (selector: any) => selector(state),
    );
  });

  it("opens for an authenticated ADMIN", () => {
    const { result } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    expect(result.current.request).toEqual(createRequest());
  });

  it("hides and resets the panel on logout with unsaved changes", () => {
    const { result, rerender } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
      result.current.setUnsavedChanges(true);
    });

    state = {
      ...state,
      api: { isLoggedIn: false },
    };

    rerender({});

    expect(result.current.request).toBeNull();
    expect(result.current.unsavedChanges).toBe(false);
    expect(result.current.confirmationPending).toBe(false);
  });

  it("closes when ADMIN previews USER", () => {
    const { result, rerender } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    state = {
      ...state,
      authorization: {
        assignedRole: "ADMIN",
        previewRole: "USER",
      },
    };

    rerender({});

    expect(result.current.request).toBeNull();
  });

  it("allows EDITOR access", () => {
    state = {
      ...state,
      authorization: {
        assignedRole: "EDITOR",
        previewRole: null,
      },
    };

    const { result } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    expect(result.current.request).toEqual(createRequest());
  });

  it("does not restore a previous request after login", () => {
    const { result, rerender } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    state = {
      ...state,
      api: { isLoggedIn: false },
    };

    rerender({});
    expect(result.current.request).toBeNull();

    state = {
      ...state,
      api: { isLoggedIn: true },
    };

    rerender({});
    expect(result.current.request).toBeNull();
  });

  it("rejects opening for USER", () => {
    state = {
      ...state,
      authorization: {
        assignedRole: "USER",
        previewRole: null,
      },
    };

    const { result } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    expect(result.current.request).toBeNull();
  });

  it("rejects opening while logged out", () => {
    state = {
      ...state,
      api: { isLoggedIn: false },
    };

    const { result } = renderHook(
      () => useLocalContentEditorPanel(),
      { wrapper },
    );

    act(() => {
      result.current.openPanel(createRequest());
    });

    expect(result.current.request).toBeNull();
  });
});
