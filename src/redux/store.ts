import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import languageReducer from "./slices/languageSlice";
import themeReducer from "./slices/themeSlice";
import apiReducer from "./slices/apiSlice";
import dataPermissionsReducer from "./slices/dataPermissionsSlice";
import menuReducer from "./slices/menuSlice";
import organizationsReducer from "./slices/organizationsSlice";
import readySlice from "./slices/readySlice";

export const store = configureStore({
  reducer: {
    language: languageReducer,
    theme: themeReducer,
    api: apiReducer,
    dataPermissions: dataPermissionsReducer,
    menu: menuReducer,
    organizations: organizationsReducer,
    ready: readySlice,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
