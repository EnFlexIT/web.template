import {
  createSlice,
} from "@reduxjs/toolkit";

jest.mock(
  "@/template/state/store/templateReducers",
  () => {
    const languageReducer = (
      state = { language: "en" },
    ) => state;

    const themeReducer = (
      state = { theme: "default" },
    ) => state;

    const apiReducer = (
      state = { initialized: false },
    ) => state;

    return {
      templateReducers: {
        language: languageReducer,
        theme: themeReducer,
        api: apiReducer,
      },
    };
  },
);

import {
  createTemplateStore,
} from "@/template/state/store/createTemplateStore";

const testApplicationSlice = createSlice({
  name: "testApplication",
  initialState: {
    enabled: true,
  },
  reducers: {},
});

describe("createTemplateStore", () => {
  it("creates a store with Base Template reducers", () => {
    const store = createTemplateStore();

    const state = store.getState();

    expect(state.language).toBeDefined();
    expect(state.theme).toBeDefined();
    expect(state.api).toBeDefined();
  });

  it("adds application-specific reducers", () => {
    const store = createTemplateStore({
      applicationReducers: {
        testApplication:
          testApplicationSlice.reducer,
      },
    });

    expect(
      store.getState().testApplication,
    ).toEqual({
      enabled: true,
    });
  });

  it("prevents applications from overriding Base Template reducers", () => {
    expect(() =>
      createTemplateStore({
        applicationReducers: {
          language:
            testApplicationSlice.reducer,
        },
      }),
    ).toThrow(
      "Application reducers must not override Base Template reducers.",
    );
  });
});