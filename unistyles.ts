import { StyleSheet } from 'react-native-unistyles'
import { Platform } from 'react-native';

const WEB_FONT_STACK =
    'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const fonts = Platform.select({
    web: {
        regular: {
            fontFamily: WEB_FONT_STACK,
            fontWeight: '400',
        },
        medium: {
            fontFamily: WEB_FONT_STACK,
            fontWeight: '500',
        },
        bold: {
            fontFamily: WEB_FONT_STACK,
            fontWeight: '600',
        },
        heavy: {
            fontFamily: WEB_FONT_STACK,
            fontWeight: '700',
        },
    },
    ios: {
        regular: {
            fontFamily: 'System',
            fontWeight: '400',
        },
        medium: {
            fontFamily: 'System',
            fontWeight: '500',
        },
        bold: {
            fontFamily: 'System',
            fontWeight: '600',
        },
        heavy: {
            fontFamily: 'System',
            fontWeight: '700',
        },
    },
    default: {
        regular: {
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
        },
        medium: {
            fontFamily: 'sans-serif-medium',
            fontWeight: 'normal',
        },
        bold: {
            fontFamily: 'sans-serif',
            fontWeight: '600',
        },
        heavy: {
            fontFamily: 'sans-serif',
            fontWeight: '700',
        },
    },
} as const);


const lightTheme = {
    dark: false,
    colors: {
        primary: 'rgb(0, 122, 255)',
        background: 'rgb(242, 242, 242)',
        card: 'rgb(255, 255, 255)',
        text: 'rgb(28, 28, 30)',
        border: 'rgb(216, 216, 216)',
        notification: 'rgb(255, 59, 48)',
        highlight: "lightgrey",
    },
    fonts,
    info: {
        fontSize: 16,
        fontFamily: undefined,
        maxContentWidth: 1400,
        screenMargin: 20,
    }
} as const

const darkTheme = {
    dark: true,
    colors: {
        primary: 'rgb(10, 132, 255)',
        background: 'rgb(1, 1, 1)',
        card: 'rgb(18, 18, 18)',
        text: 'rgb(229, 229, 231)',
        border: 'rgb(39, 39, 41)',
        notification: 'rgb(255, 69, 58)',
        highlight: "grey",
    },
    fonts,
    info: {
        fontSize: 16,
        fontFamily: undefined,
        maxContentWidth: 1400,
        screenMargin: 20,
    }
} as const

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
    settings: {
        adaptiveThemes: true
    },
    themes: {
        light: lightTheme,
        dark: darkTheme,
    },
    breakpoints,
})
