import {
  configureStore,
  type Action,
  type ThunkAction,
} from "@reduxjs/toolkit";

import {
  rootReducer,
  type RootState,
} from "./rootReducer";

export const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

export type { RootState };

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;