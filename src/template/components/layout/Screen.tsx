import {
  ScrollView,
  View,
  ViewProps,
} from "react-native";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  isMobileShellRuntime,
} from "@/template/runtime/runtime";

export type ScreenLayout =
  | "default"
  | "wide";

type Props = ViewProps & {
  scrollable?: boolean;
  layout?: ScreenLayout;
};

export function Screen({
  scrollable = true,
  layout = "default",
  ...props
}: Props) {
  const layoutStyle =
    layout === "wide"
      ? styles.containerWide
      : undefined;

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          layoutStyle,
          props.style,
        ]}
        showsVerticalScrollIndicator
        showsHorizontalScrollIndicator={
          false
        }
      >
        {props.children}
      </ScrollView>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.container,
        layoutStyle,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create(
  (theme, rt) => {
    const isSmallScreen =
      rt.screen.width < 900;

    const isMobileShell =
      isMobileShellRuntime();

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
            : theme.info
                .maxContentWidth,

        padding: isMobileShell
          ? 12
          : isSmallScreen
            ? 12
            : theme.info
                .screenMargin,

        flexGrow: 1,
      },

      /*
       * Wide screens keep the standard Screen spacing
       * and scrolling behaviour while using the full
       * available content width.
       *
       * The default layout remains unchanged.
       */
      containerWide: {
        maxWidth: "100%",
      },
    };
  },
);