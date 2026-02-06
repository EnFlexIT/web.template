import { ThemedText } from "../../components/themed/ThemedText";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  DataPermissionsState,
  selectDataPermissions,
  setDataPermissions,
} from "../../redux/slices/dataPermissionsSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { Table } from "../../components/Table";
import { Screen } from "../../components/Screen";
import { StyleSheet } from "react-native-unistyles";
import { View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { H4 } from "../../components/stylistic/H4";
import { TableSwitchCell } from "../../components/ui-elements/TableSwitchCell";

export function PrivacySettings() {
  const dispatch = useAppDispatch();
  const dataPermissions = useAppSelector(selectDataPermissions);

  type PermissionKey = Exclude<keyof DataPermissionsState, "accepted">;

  const PERMISSION_KEYS: PermissionKey[] = [
    "mandatory",
    "statistics",
    "comfort",
    "personalised",
  ];

  const [localDataPermissions, setLocalDataPermissions] =
    useState<DataPermissionsState>({ ...dataPermissions });

  useEffect(() => {
    setLocalDataPermissions({ ...dataPermissions });
  }, [dataPermissions]);

  const { t } = useTranslation(["Settings.PrivacySecurity"]);

  return (
    <Screen>
      <View style={styles.container}>
        <H4>{t("privacy_settings_description")}</H4>

        <Table
          data={PERMISSION_KEYS.map((key, idx) => {
            const value = localDataPermissions[key];
            const disabled = key === "mandatory";

            return [
              <ThemedText key={`k-${idx}`} style={styles.nonSelect}>
                {t(key)}
              </ThemedText>,

              <TableSwitchCell
                key={`v-${idx}`}
                value={value}
                disabled={disabled}
                onChange={(next) => {
                  if (disabled) return;

                  
                  setLocalDataPermissions((prev) => {
                    const updated: DataPermissionsState = {
                      ...prev,
                      [key]: next,
                      mandatory: true, 
                    };

                    dispatch(setDataPermissions(updated));
                    return updated;
                  });
                }}
              />,
            ];
          })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    padding: 16,
    gap: 12,
  },
  nonSelect: {
    userSelect: "none",
  },
}));
