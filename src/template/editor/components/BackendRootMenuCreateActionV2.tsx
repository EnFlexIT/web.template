import React, { useState } from "react";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectCanEditInUiPreview,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

import {
  BackendMenuCreateDialogV2,
} from "./BackendMenuCreateDialogV2";

import {
  selectAvailableGroupRoles,
} from "@/template/state/authorization/selectGroupMenuRole";

const EMPTY_ROOT_GROUP_ROLES: readonly string[] = [];

export function BackendRootMenuCreateActionV2() {
  const { t } = useTranslation(["Editor"]);

  const [open, setOpen] = useState(false);

  const availableRoles = useAppSelector(state =>
    state.api && state.groupRoles
      ? selectAvailableGroupRoles(state)
      : EMPTY_ROOT_GROUP_ROLES,
  );

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

  if (!allowed) {
    return null;
  }

  return (
    <>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#d9d9d9",
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("create.rootAction")}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 10,
          }}
        >
          <Text>
            + {t("create.rootAction")}
          </Text>
        </Pressable>
      </View>

      <BackendMenuCreateDialogV2
        visible={open}
        parentId={null}
        parentCaption=""
        availableRoles={availableRoles}
        onClose={() => setOpen(false)}
      />
    </>
  );
}