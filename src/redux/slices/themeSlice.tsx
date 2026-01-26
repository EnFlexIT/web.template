import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UnistylesRuntime } from "react-native-unistyles";
import { RootState } from "../store";

type ThemeName = "light" | "dark";

export interface ThemeInfo {
  adaptive: boolean;
  theme: ThemeName;
}

export interface ThemeState {
  val: ThemeInfo;
}

const STORAGE_KEY = "color";

const DEFAULT_THEME: ThemeInfo = {
  adaptive: true,
  theme: "light",
};

const initialState: ThemeState = {
  val: DEFAULT_THEME,
};

/**
 * ✅ Normalisiert alles, was aus AsyncStorage kommt:
 * - ThemeInfo: { adaptive, theme }
 * - ThemeState: { val: { adaptive, theme } }  (alt)
 * - irgendwas kaputtes -> DEFAULT_THEME
 */
const normalizeTheme = (raw: any): ThemeInfo => {
  const candidate = raw?.val ?? raw;

  const adaptive =
    typeof candidate?.adaptive === "boolean" ? candidate.adaptive : DEFAULT_THEME.adaptive;

  const theme: ThemeName =
    candidate?.theme === "dark" || candidate?.theme === "light"
      ? candidate.theme
      : DEFAULT_THEME.theme;

  return { adaptive, theme };
};

/**
 * ✅ Unistyles-Regel:
 * - setTheme() darf nicht laufen, wenn adaptiveThemes aktiv sind.
 * Daher:
 * 1) adaptiveThemes AUS
 * 2) setTheme(validTheme)
 * 3) adaptiveThemes an/aus je nach Setting
 */
const applyUnistylesTheme = (info: ThemeInfo) => {
  // 1) adaptive erstmal AUS, sonst meckert Unistyles
  UnistylesRuntime.setAdaptiveThemes(false);

  // 2) immer ein valides Theme setzen (nie undefined)
  UnistylesRuntime.setTheme(info.theme);

  // 3) dann adaptive wieder setzen
  UnistylesRuntime.setAdaptiveThemes(Boolean(info.adaptive));
};

export const initializeTheme = createAsyncThunk("theme/initialize", async (): Promise<ThemeInfo> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_THEME;

    const parsed = JSON.parse(stored);
    return normalizeTheme(parsed);
  } catch (e) {
    console.warn("Theme storage corrupted, fallback to default", e);
    return DEFAULT_THEME;
  }
});

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    // ✅ Payload ist ThemeInfo (NICHT ThemeState!)
    setTheme: (state, action: PayloadAction<ThemeInfo>) => {
      const next = normalizeTheme(action.payload);

      state.val = next;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyUnistylesTheme(next);
    },

    // optional, wenn du manchmal ThemeState dispatchst (z.B. alte UI):
    setThemeState: (state, action: PayloadAction<ThemeState>) => {
      const next = normalizeTheme(action.payload);

      state.val = next;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyUnistylesTheme(next);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeTheme.fulfilled, (state, action) => {
      const next = normalizeTheme(action.payload);

      state.val = next;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyUnistylesTheme(next);
    });
  },
});

export const { setTheme, setThemeState } = themeSlice.actions;

// ✅ Gib direkt ThemeInfo zurück (damit LoginScreen nicht undefined bekommt)
export const selectThemeInfo = (state: RootState) => state.theme?.val ?? DEFAULT_THEME;

export default themeSlice.reducer;