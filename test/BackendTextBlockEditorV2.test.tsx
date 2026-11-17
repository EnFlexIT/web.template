import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useStore } from "react-redux";

import { useAppSelector } from
  "../src/template/state/store/useAppSelector";

import { selectBackendContentWriteContext } from
  "../src/template/editor/adapters/updateBackendContentElementFromStore";

import { saveBackendTextWithConflictCheck } from
  "../src/template/editor/adapters/saveBackendTextWithConflictCheck";

import { BackendTextBlockEditorV2 } from
  "../src/template/editor/components/BackendTextBlockEditorV2";

import type { BackendEditorTextBlockV2 } from
  "../src/template/editor/adapters/mapBackendContentToEditorV2";

jest.mock("react-redux", () => ({
  useStore: jest.fn(),
}));

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({
    useAppSelector: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({
    selectBackendContentWriteContext: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/saveBackendTextWithConflictCheck",
  () => ({
    saveBackendTextWithConflictCheck: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/components/ContentTextBlockEditor",
  () => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return {
      ContentTextBlockEditor: (props: {
        blockId: string;
        html: string;
        onChange: (id: string, html: string) => void;
      }) =>
        React.createElement(
          Pressable,
          {
            onPress: () =>
              props.onChange(
                props.blockId,
                "<p>Bearbeiteter Text</p>",
              ),
          },
          React.createElement(Text, null, "Text aendern"),
        ),
    };
  },
);

jest.mock(
  "../src/template/components/design-system/ui-elements/ActionButton",
  () => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return {
      ActionButton: (props: {
        label: string;
        onPress: () => void;
      }) =>
        React.createElement(
          Pressable,
          { onPress: props.onPress },
          React.createElement(Text, null, props.label),
        ),
    };
  },
);

jest.mock(
  "../src/template/components/design-system/themed/ThemedText",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      ThemedText: (props: {
        children: React.ReactNode;
        style?: unknown;
      }) =>
        React.createElement(
          Text,
          { style: props.style },
          props.children,
        ),
    };
  },
);

const mockStore = useStore as unknown as jest.Mock;
const mockSelector = useAppSelector as unknown as jest.Mock;
const mockContext = selectBackendContentWriteContext as jest.Mock;
const mockSave = saveBackendTextWithConflictCheck as jest.Mock;

const block: BackendEditorTextBlockV2 = {
  kind: "text",
  backendContentId: 42,
  position: 0,
  editable: true,
  html: "<p>Original</p>",
  original: {
    abstractSiteContentType: "SiteContentText",
    uniqueContentId: 42,
    editable: true,
    updatePeriodInSeconds: 30,
    mimeType: "text/html",
    text: "<p>Original</p>",
  },
};

describe("BackendTextBlockEditorV2 UI", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockStore.mockReturnValue({
      getState: () => ({ api: {} }),
    });

    mockSelector.mockReturnValue(true);

    mockContext.mockReturnValue({
      isLoggedIn: true,
      canEdit: true,
      isSwitchingServer: false,
      isLoggingOut: false,
      server: "https://test.invalid",
    });

    mockSave.mockResolvedValue(undefined);
  });

  it("does not display editing controls without permission", () => {
    mockSelector.mockReturnValue(false);

    render(<BackendTextBlockEditorV2 block={block} />);

    expect(
      screen.queryByText("Backend-Text bearbeiten"),
    ).toBeNull();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it("edits text and invokes the guarded save", async () => {
    render(<BackendTextBlockEditorV2 block={block} />);

    fireEvent.press(
      screen.getByText("Backend-Text bearbeiten"),
    );

    fireEvent.press(screen.getByText("Text aendern"));

    fireEvent.press(
      screen.getByText("Im Backend speichern"),
    );

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        elementId: 42,
        original: block.original,
        html: "<p>Bearbeiteter Text</p>",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Backend-Speicherung erfolgreich/,
        ),
      ).toBeTruthy();
    });
  });

  it("keeps editing possible after a conflict", async () => {
    mockSave.mockRejectedValueOnce(
      new Error(
        "Backend content conflict: reload before editing",
      ),
    );

    render(<BackendTextBlockEditorV2 block={block} />);

    fireEvent.press(
      screen.getByText("Backend-Text bearbeiten"),
    );

    fireEvent.press(screen.getByText("Text aendern"));

    fireEvent.press(
      screen.getByText("Im Backend speichern"),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Backend-Speicherung fehlgeschlagen/,
        ),
      ).toBeTruthy();
    });

    expect(
      screen.getByText("Text aendern"),
    ).toBeTruthy();

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("distinguishes reload failure from save failure", async () => {
    const onSaved = jest.fn().mockRejectedValue(
      new Error("Reload failed"),
    );

    render(
      <BackendTextBlockEditorV2
        block={block}
        onSaved={onSaved}
      />,
    );

    fireEvent.press(
      screen.getByText("Backend-Text bearbeiten"),
    );

    fireEvent.press(
      screen.getByText("Im Backend speichern"),
    );

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Backend-Speicherung erfolgreich, aber/,
        ),
      ).toBeTruthy();
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("discards edits without saving", () => {
    render(<BackendTextBlockEditorV2 block={block} />);

    fireEvent.press(
      screen.getByText("Backend-Text bearbeiten"),
    );

    fireEvent.press(screen.getByText("Text aendern"));

    fireEvent.press(
      screen.getByText("Verwerfen"),
    );

    expect(mockSave).not.toHaveBeenCalled();

    expect(
      screen.getByText("Backend-Text bearbeiten"),
    ).toBeTruthy();
  });
});