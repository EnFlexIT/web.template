import AntDesign_ from '@expo/vector-icons/AntDesign';
import { useAppSelector } from "../hooks/useAppSelector";
import { logout, selectApi } from "../redux/slices/apiSlice";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { View } from "react-native";
import Feather_ from '@expo/vector-icons/Feather';
import { selectTheme, setTheme } from "../redux/slices/themeSlice";
import { useAppDispatch } from "../hooks/useAppDispatch";

const Feather = withUnistyles(Feather_)
const AntDesign = withUnistyles(AntDesign_)

function LogoutButton() {

    const dispatch = useAppDispatch()

    return <AntDesign
        onPress={() => {
            dispatch(logout())
        }}
        name="logout"
        size={24}
        style={[styles.color]}
    />
}

function ColorSwitcher() {

    const { val: { theme } } = useAppSelector(selectTheme)
    const dispatch = useAppDispatch()

    return <Feather
        onPress={() => dispatch(setTheme({
            val: {
                adaptive: false,
                theme: theme === "dark" ? "light" : "dark"
            }
        }))}
        name={theme === "dark" ? "moon" : "sun"}
        size={24}
        style={[styles.color]}
    />
}

/**
 * The Drawer conditionally renders this component and because it uses `useAppSelector` this counts as a conditional hook and the app crashes.
 * we therefore need to pass the hook value from higher up.
 * 
 * unfortunate 
 */
interface ToolBoxProps {
    isLoggedIn: boolean
}
export function ToolBox({ isLoggedIn }: ToolBoxProps) {
    return (
        <View style={[styles.toolBoxContainer]}>
            <ColorSwitcher />
            {/* You can only log out, if you are logged in  */}
            {isLoggedIn && <LogoutButton />}
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    toolBoxContainer: {
        // padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
    },
    color: {
        color: theme.colors.text
    }
}))
