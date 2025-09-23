import { useWindowDimensions } from "react-native"

export function useIsWide() {
    const { width: windowWidth } = useWindowDimensions()
    return windowWidth > 800
}
