import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import languageReducer from "./slices/languageSlice"
import themeReducer from "./slices/themeSlice"
import apiReducer from "./slices/apiSlice"
import dataPermissionsReducer from "./slices/dataPermissionsSlice"
import menuReducer from "./slices/menuSlice"

export const store = configureStore({
    reducer: {
        language: languageReducer,
        theme: themeReducer,
        api: apiReducer,
        dataPermissions: dataPermissionsReducer,
        menu: menuReducer,
    }
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>
