import React from "react";
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";

import {
  ActionButton,
} from "@/template/components/design-system/ui-elements/ActionButton";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectCanEditInUiPreview,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

export interface BackendContentEditorLaunchV2Props {
  menuId: number;
}

/**
 * Opens the V2 editor for the currently displayed backend menu.
 * Does not modify content or local editor drafts.
 */
export function BackendContentEditorLaunchV2({
  menuId,
}: BackendContentEditorLaunchV2Props) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const allowed = useAppSelector(state => {
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

  if (
    !allowed ||
    !Number.isSafeInteger(menuId) ||
    menuId <= 0
  ) {
    return null;
  }

  return (
    <ActionButton
      label="Backend-Inhalte bearbeiten"
      variant="secondary"
      onPress={() => {
        navigation.navigate("3027", {
          backendMenuId: menuId,
        });
      }}
    />
  );
}