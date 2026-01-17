import AntDesign_ from "@expo/vector-icons/AntDesign";
import Feather_ from "@expo/vector-icons/Feather";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { logout } from "../redux/slices/apiSlice";
import { selectTheme, setTheme } from "../redux/slices/themeSlice";
import { logoutBaseMode, selectBaseMode } from "../redux/slices/baseModeSlice";

const Feather = withUnistyles(Feather_);
const AntDesign = withUnistyles(AntDesign_);

type ToolBoxProps = {
  isLoggedIn: boolean;
  isBaseMode?: boolean;
};

function ColorSwitcher() {
  const { val: { theme } } = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  return (
    <Feather
      onPress={() =>
        dispatch(
          setTheme({
            val: {
              adaptive: false,
              theme: theme === "dark" ? "light" : "dark",
            },
          }),
        )
      }
      name={theme === "dark" ? "moon" : "sun"}
      size={24}
      style={[styles.color]}
    />
  );
}

export function ToolBox({ isLoggedIn, isBaseMode }: ToolBoxProps) {
  const dispatch = useAppDispatch();
  const { baseModeLoggedIn } = useAppSelector(selectBaseMode);

  const showLogout =
    isLoggedIn || (isBaseMode === true && baseModeLoggedIn === true);

  return (
    <View style={[styles.toolBoxContainer]}>
      <ColorSwitcher />

      {showLogout ? (
        <AntDesign
          onPress={() => {
            if (isLoggedIn) {
              dispatch(logout());
            } else {
              dispatch(logoutBaseMode());
            }
          }}
          name="logout"
          size={24}
          style={[styles.color]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toolBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  color: {
    color: theme.colors.text,
  },
}));
