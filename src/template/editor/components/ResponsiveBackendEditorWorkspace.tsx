import React, { useEffect, useState } from "react";
import {
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigationState } from "@react-navigation/native";
import { useUnistyles } from "react-native-unistyles";

import { useAppSelector } from "@/template/state/store/useAppSelector";
import { selectCanEditInUiPreview } from "@/template/state/authorization/selectUiPreviewMode";
import { selectBackendContentWriteContext } from "../adapters/updateBackendContentElementFromStore";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";

import { RouteAwareLocalEditorPanel } from "./RouteAwareLocalEditorPanel";
import { getBackendEditorWorkspaceLayout } from "../layout/getBackendEditorWorkspaceLayout";

type ActiveTab = "preview" | "editor";

export function ResponsiveBackendEditorWorkspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useUnistyles();

  const backendMenuId = useNavigationState(state => {
    const route = state.routes[state.index];
    const id = (
      route?.params as { backendMenuId?: unknown } | undefined
    )?.backendMenuId;

    return (
      route?.name === "3027" &&
      typeof id === "number" &&
      Number.isSafeInteger(id) &&
      id > 0
    ) ? id : null;
  });

  const canEditBackend = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      state.backendRoles.status === "ready" &&
      selectCanEditInUiPreview(state) &&
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.trim().length > 0
    );
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");

  const mobileEditor =
    getBackendEditorWorkspaceLayout(
      width,
      backendMenuId !== null,
      canEditBackend,
    ) === "tabs";

  useEffect(() => {
    setActiveTab("preview");
  }, [backendMenuId]);

  // No conditional unmount: the editor draft must survive
  // switching between preview and editor tabs.
  const previewHidden = mobileEditor && activeTab === "editor";
  const editorHidden = mobileEditor && activeTab === "preview";

  return (
    <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
      {mobileEditor && (
        <View
          style={{
            flexDirection: "row",
            padding: 8,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }}
        >
          {([
            ["preview", "Vorschau"],
            ["editor", "Bearbeiten"],
          ] as const).map(([tab, label]) => (
            <Pressable
              key={tab}
              testID={`backend-mobile-tab-${tab}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor:
                  activeTab === tab
                    ? theme.colors.card
                    : "transparent",
              }}
            >
              <ThemedText
                style={{
                  fontWeight:
                    activeTab === tab ? "700" : "400",
                }}
              >
                {label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: previewHidden ? "none" : "flex",
          }}
        >
          {children}
        </View>

        <RouteAwareLocalEditorPanel
          mobileMode={mobileEditor}
          mobileHidden={editorHidden}
        />
      </View>
    </View>
  );
}