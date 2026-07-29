import {
  useEffect,
  useRef,
} from "react";

import {
  Platform,
} from "react-native";

import {
  useUnistyles,
} from "react-native-unistyles";

let scrollbarInstanceCounter = 0;

/**
 * Erstellt eine eindeutige nativeID und hinterlegt dafür
 * Web-Scrollbar-Styles, die sich automatisch an das Theme anpassen.
 *
 * Verwendung:
 *
 * const scrollbarNativeId =
 *   useThemedScrollbarWeb("backend-list");
 *
 * <View nativeID={scrollbarNativeId}>
 *   <FlatList ... />
 * </View>
 */
export function useThemedScrollbarWeb(
  prefix = "enflexit-scrollbar",
): string {
  const { theme } = useUnistyles();

  const nativeIdRef =
    useRef<string | null>(null);

  if (!nativeIdRef.current) {
    scrollbarInstanceCounter += 1;

    nativeIdRef.current =
      `${prefix}-${scrollbarInstanceCounter}`;
  }

  const nativeId =
    nativeIdRef.current;

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    if (
      typeof document === "undefined"
    ) {
      return;
    }

    const styleElementId =
      `${nativeId}-styles`;

    let styleElement =
      document.getElementById(
        styleElementId,
      ) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement =
        document.createElement("style");

      styleElement.id =
        styleElementId;

      document.head.appendChild(
        styleElement,
      );
    }

    const trackColor =
      theme.colors.card;

    const thumbColor =
      theme.colors.border;

    const thumbHoverColor =
      theme.colors.highlight;

    styleElement.textContent = `
      /*
       * Firefox
       */
      #${nativeId},
      #${nativeId} * {
        scrollbar-width: thin;
        scrollbar-color:
          ${thumbColor}
          ${trackColor};
      }

      /*
       * Chromium, Edge und Safari
       */
      #${nativeId}::-webkit-scrollbar,
      #${nativeId} *::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      #${nativeId}::-webkit-scrollbar-track,
      #${nativeId} *::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: 6px;
      }

      #${nativeId}::-webkit-scrollbar-thumb,
      #${nativeId} *::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border: 2px solid ${trackColor};
        border-radius: 6px;
      }

      #${nativeId}::-webkit-scrollbar-thumb:hover,
      #${nativeId} *::-webkit-scrollbar-thumb:hover {
        background: ${thumbHoverColor};
      }

      #${nativeId}::-webkit-scrollbar-corner,
      #${nativeId} *::-webkit-scrollbar-corner {
        background: ${trackColor};
      }
    `;

    return () => {
      styleElement?.remove();
    };
  }, [
    nativeId,
    theme.colors.card,
    theme.colors.border,
    theme.colors.highlight,
  ]);

  return nativeId;
}