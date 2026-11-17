import React from "react";
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";

import {
  Dropdown,
} from "@/template/components/design-system/ui-elements/Dropdown";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectCanEditInUiPreview,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

export interface BackendMenuContextActionsV2Props {
  menuId: number;
}

export function BackendMenuContextActionsV2({
  menuId,
}: BackendMenuContextActionsV2Props) {
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

  if (!allowed || !Number.isSafeInteger(menuId) || menuId <= 0) {
    return null;
  }

  return (
    <Dropdown<string>
      value="open"
      options={{ open: "Bearbeiten" }}
      optionIcons={{ open: "edit-2" }}
      triggerLabel="⋯"
      minimalMenu
      menuPlacement="auto"
      triggerWidth={32}
      hideChevron
      appearance="menu"
      menuWidth={200}
      size="sm"
      onChange={action => {
        if (action !== "open") return;

        navigation.navigate("3027", {
          backendMenuId: menuId,
        });
      }}
    />
  );
}