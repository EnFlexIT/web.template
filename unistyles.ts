import { StyleSheet } from 'react-native-unistyles'
import { lightTheme}from "@/template/styles/lightTheme";
import { darkTheme } from '@/template/styles/darkTheme';


const appThemes = {
    light: lightTheme,
    dark: darkTheme
}

const breakpoints = {
    xs: 0,
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200,
}

type AppBreakpoints = typeof breakpoints
type AppThemes = typeof appThemes

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes { }
    export interface UnistylesBreakpoints extends AppBreakpoints { }
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },

  breakpoints,

  settings: {
    initialTheme: "light",
  },
});
