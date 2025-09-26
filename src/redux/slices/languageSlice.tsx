import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initializeMenu, setActiveMenuId, updateMenu } from './menuSlice';

const key = "lng" as const

const defaultLanguage: string = process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE

export interface LanguageState {
    language: string
}

const initialState: LanguageState = {
    language: defaultLanguage,
}

export const initializeLanguage = createAsyncThunk(
    'language/initialize',
    async () => {
        const storedLng = await AsyncStorage.getItem(key)
        const res = storedLng ?? defaultLanguage
        return res
    },
)

export const languageSlice = createSlice({
    name: 'lng',
    initialState,
    reducers: {
        internalSetLanguage: (state, action: PayloadAction<LanguageState>) => {
            state.language = action.payload.language
            AsyncStorage.setItem(key, action.payload.language)
            i18next.changeLanguage(action.payload.language)
        }
    },
    extraReducers: (builder) => {
        builder.addCase(initializeLanguage.fulfilled, (state, action) => {
            state.language = action.payload
            AsyncStorage.setItem(key, action.payload)
            i18next.changeLanguage(action.payload)
        })
    },
})

export const setLanguage = createAsyncThunk(
    "lng/setLanguage",
    async (arg: LanguageState, thunkAPI) => {
        await thunkAPI.dispatch(languageSlice.actions.internalSetLanguage(arg))

        await thunkAPI.dispatch(updateMenu())
    }
)

export const { internalSetLanguage } = languageSlice.actions

export const selectLanguage = (state: RootState) => state.language

export default languageSlice.reducer
