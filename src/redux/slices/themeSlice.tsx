import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnistylesRuntime } from 'react-native-unistyles'

const key = "color" as const

const defaultThemeInfo: ThemeInfo = {
    adaptive: true,
    theme: 'light',
}

interface ThemeInfo {
    adaptive: boolean,
    theme: 'dark' | 'light',
}

export interface ThemeState {
    val: ThemeInfo,
}

const initialState: ThemeState = {
    val: defaultThemeInfo,
}

export const initializeTheme = createAsyncThunk(
    'theme/initialize',
    async () => {
        const storedTheme = await AsyncStorage.getItem(key)
        if (storedTheme) {
            return JSON.parse(storedTheme) as ThemeInfo
        }
        return defaultThemeInfo
    },
)

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeState>) => {
            state.val.adaptive = action.payload.val.adaptive
            state.val.theme = action.payload.val.theme

            AsyncStorage.setItem(key, JSON.stringify(action.payload.val))
            if (action.payload.val.adaptive) {
                UnistylesRuntime.setAdaptiveThemes(true)
            } else {
                UnistylesRuntime.setAdaptiveThemes(false)
                UnistylesRuntime.setTheme(action.payload.val.theme)
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(initializeTheme.fulfilled, (state, action) => {
            state.val.adaptive = action.payload.adaptive
            state.val.theme = action.payload.theme

            AsyncStorage.setItem(key, JSON.stringify(action.payload))
            if (action.payload.adaptive) {
                UnistylesRuntime.setAdaptiveThemes(true)
            } else {
                UnistylesRuntime.setAdaptiveThemes(false)
                UnistylesRuntime.setTheme(action.payload.theme)
            }
        })
    },
})

export const { setTheme } = themeSlice.actions

export const selectTheme = (state: RootState) => state.theme

export default themeSlice.reducer

