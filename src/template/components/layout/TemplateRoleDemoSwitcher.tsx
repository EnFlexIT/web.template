import { Platform, Pressable, Text, View } from "react-native";
import { Dropdown } from "@design-system";

import { useAppDispatch } from "@/template/state/store/useAppDispatch";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import {
  startTemplateRolePreview,
  setTemplatePreviewRole,
  stopTemplateRolePreview,
} from "@/template/state/authorization/templateRolePreviewSlice";

import {
  selectActiveTemplatePreviewRole,
} from "@/template/state/authorization/selectTemplateRolePreview";

import type {
  EffectiveTemplateRole,
} from "@/template/state/authorization/templateRolePermissions";

const options: Record<EffectiveTemplateRole, string> = {
  user: "User",
  frontendEditor: "Frontend-Editor",
  backendEditor: "Backend-Editor",
};

/**
 * Development-only role preview.
 * Does not grant backend permissions.
 */
export function TemplateRoleDemoSwitcher() {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(
    state => state.api.isLoggedIn,
  );

  const enabled = useAppSelector(
    state => state.templateRolePreview.enabled,
  );

  const role = useAppSelector(
    selectActiveTemplatePreviewRole,
  );

  const actualRole = useAppSelector(
    state => state.templateRolePreview.actualRole,
  );

  if (!__DEV__ || Platform.OS !== "web" || !isLoggedIn) {
    return null;
  }

  if (!enabled) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="UI-Rollendemo starten"
        onPress={() => dispatch(startTemplateRolePreview("superAdmin"))}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text>UI-Demo starten</Text>
      </Pressable>
    );
  }

  if (actualRole !== "superAdmin" || role === null) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => dispatch(stopTemplateRolePreview())}
      >
        <Text>UI-Demo beenden</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Dropdown<EffectiveTemplateRole>
        value={role}
        options={options}
        onChange={nextRole => {
          dispatch(setTemplatePreviewRole(nextRole));
        }}
        size="sm"
        appearance="menu"
        menuWidth={180}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="UI-Rollendemo beenden"
        onPress={() => dispatch(stopTemplateRolePreview())}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text>Demo beenden</Text>
      </Pressable>
    </View>
  );
}