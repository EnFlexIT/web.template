import { fonts } from "./fonts";

export const lightTheme = {
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
        maxContentWidth: 800,
        screenMargin: 20,
        fontFamily: undefined,
    }
} as const
