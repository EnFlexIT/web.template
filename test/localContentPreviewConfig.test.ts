import {
  isLocalContentPreviewEnabled,
} from "../src/template/editor/config/localContentPreviewConfig";

describe("isLocalContentPreviewEnabled", () => {
  const originalValue =
    process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW;
    } else {
      process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW = originalValue;
    }
  });

  it("is disabled when the environment variable is absent", () => {
    delete process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW;

    expect(isLocalContentPreviewEnabled()).toBe(false);
  });

  it("is disabled when the environment variable is false", () => {
    process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW = "false";

    expect(isLocalContentPreviewEnabled()).toBe(false);
  });

  it("requires the development environment", () => {
    process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW = "true";

    expect(isLocalContentPreviewEnabled()).toBe(__DEV__ === true);
  });

  it("rejects other values", () => {
    process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW = "1";

    expect(isLocalContentPreviewEnabled()).toBe(false);
  });
});