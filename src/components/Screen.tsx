import { View, ViewProps, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { isMobileShellRuntime } from "../util/runtime";

type Props = ViewProps & {
  scrollable?: boolean;
};

export function Screen({ scrollable = true, ...props }: Props) {
  if (scrollable) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, props.style]}
        showsVerticalScrollIndicator
        showsHorizontalScrollIndicator={false}
      >
        {props.children}
      </ScrollView>
    );
  }

  return <View {...props} style={[styles.container, props.style]} />;
}

const styles = StyleSheet.create((theme, rt) => {
  const isSmallScreen = rt.screen.width < 900;
  const isMobileShell = isMobileShellRuntime();

  return {
    scroll: {
      flex: 1,
      width: "100%",
    },

    container: {
      width: "100%",

      maxWidth: isMobileShell
        ? "100%"
        : isSmallScreen
          ? "100%"
          : theme.info.maxContentWidth,

      

      padding: isMobileShell
        ? 12
        : isSmallScreen
          ? 12
          : theme.info.screenMargin,

      flexGrow: 1,
    },
  };
});