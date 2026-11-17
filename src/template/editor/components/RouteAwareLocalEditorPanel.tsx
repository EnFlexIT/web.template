import React from "react";
import { useUnistyles } from "react-native-unistyles";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import { selectCanEditInUiPreview } from "@/template/state/authorization/selectUiPreviewMode";
import { selectBackendContentWriteContext } from "../adapters/updateBackendContentElementFromStore";
import { BackendMenuContentScreenV2 } from "../screens/BackendMenuContentScreenV2";
import { useWindowDimensions, View } from "react-native";
import { getBackendEditorPanelWidth } from "../layout/getBackendEditorPanelWidth";
import { useNavigationState } from "@react-navigation/native";

import {
  LocalContentEditorPanel,
} from "./LocalContentEditorPanel";

/**
 * Keeps the local panel separate from the V2 backend editor.
 * Does not close or discard local editor requests or drafts.
 */
export function RouteAwareLocalEditorPanel({
  mobileMode = false,
  mobileHidden = false,
}: {
  mobileMode?: boolean;
  mobileHidden?: boolean;
} = {}) {
  const backendMenuId = useNavigationState(state => {
    const route = state.routes[state.index];

    const backendMenuId = (
      route?.params as { backendMenuId?: unknown } | undefined
    )?.backendMenuId;

    return (
      route?.name === "3027" &&
      typeof backendMenuId === "number" &&
      Number.isSafeInteger(backendMenuId) &&
      backendMenuId > 0
    ) ? backendMenuId : null;
  });

  const canEditBackend = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);
    return state.backendRoles.status === "ready" &&
      selectCanEditInUiPreview(state) &&
      context.isLoggedIn && context.canEdit &&
      !context.isSwitchingServer && !context.isLoggingOut &&
      context.server.trim().length > 0;
  });
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = getBackendEditorPanelWidth(windowWidth);
  const isBackendEditor = backendMenuId !== null;

  return (
    <>
      <View
      style={
        isBackendEditor
          ? { display: "none" }
          : {
              alignSelf: "stretch",
              height: "100%",
              minHeight: 0,
            }
      }
    >
      <LocalContentEditorPanel />
      </View>
      {isBackendEditor && canEditBackend && (
        <View
          style={{
            display: mobileHidden ? "none" : "flex",
            width: mobileMode ? "100%" : panelWidth,
            maxWidth: "100%",
            flexBasis: mobileMode ? "100%" : panelWidth,
            flexGrow: 0,
            flexShrink: mobileMode ? 1 : 0,
            height: "100%",
            alignSelf: "stretch",
            minHeight: 0,
            backgroundColor: theme.colors.card,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.border,
          }}
        >
          <BackendMenuContentScreenV2
            menuId={backendMenuId}
            mode="editor"
          />
        </View>
      )}
    </>
  );
}