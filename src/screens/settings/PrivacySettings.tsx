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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { H4 } from "../../components/stylistic/H4";
import { TableSwitchCell } from "../../components/ui-elements/TableSwitchCell";

type PermissionKey = Exclude<keyof DataPermissionsState, "accepted">;

const PERMISSION_KEYS: PermissionKey[] = [
  "mandatory",
  "statistics",
  "comfort",
  "personalised",
];

export function PrivacySettings() {
  const dispatch = useAppDispatch();
  const dataPermissions = useAppSelector(selectDataPermissions);

  const [localDataPermissions, setLocalDataPermissions] =
    useState<DataPermissionsState>({ ...dataPermissions });

  useEffect(() => {
    setLocalDataPermissions({ ...dataPermissions });
  }, [dataPermissions]);

  const { t } = useTranslation(["Settings.PrivacySecurity"]);

  const allAccepted = useMemo(() => {
    return PERMISSION_KEYS.every((k) => localDataPermissions[k] === true);
  }, [localDataPermissions]);
  const toggleAcceptAll = (next: boolean) => {
  const updated: DataPermissionsState = {
    ...localDataPermissions,
    mandatory: true,
    statistics: next,
    comfort: next,
    personalised: next,
    accepted: next,
  };

  setLocalDataPermissions(updated);
  dispatch(setDataPermissions(updated));
};


  return (
    <Screen>
      <View style={styles.container}>
        <H4>{t("privacy_settings_description")}</H4>
<Table
 columnFlex={[5, 1]}
  data={[
    ...PERMISSION_KEYS.map((key, idx) => {
      const value = localDataPermissions[key];
      const disabled = key === "mandatory";

      return [
        <View key={`left-${idx}`} style={styles.leftCell}>
          <ThemedText style={[styles.title, styles.nonSelect]}>
            {t(`permissions.${key}.title`)}
          </ThemedText>

          <ThemedText style={[styles.description, styles.nonSelect]}>
            {t(`permissions.${key}.description`)}
          </ThemedText>
        </View>,

        <View key={`right-${idx}`} style={styles.rightCell}>
          <TableSwitchCell
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

                updated.accepted = PERMISSION_KEYS.every(
                  (k) => (k === key ? next : updated[k]) === true
                );

                dispatch(setDataPermissions(updated));
                return updated;
              });
            }}
          />
        </View>,
      ];
    }),

  
    [
      <View key="accept-all-left" style={styles.leftCell}>
        <ThemedText style={[styles.title, styles.nonSelect]}>
          {t("accept_all")}
        </ThemedText>

        <ThemedText style={[styles.description, styles.nonSelect]}>
          
        </ThemedText>
      </View>,

      <View key="accept-all-right" style={styles.rightCell}>
        <TableSwitchCell
          value={allAccepted}
          onChange={toggleAcceptAll}
        />
      </View>,
    ],
  ]}
/>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    padding: 5,
    gap: 5,
  },
  nonSelect: {
    userSelect: "none",
  },
  leftCell: {
    gap: 4,
    paddingVertical: 2,
  },
  title: {
    fontWeight: "700",
  },
  description: {
    
  flexShrink:10,
  },
  rightCell: {
    
   
  },
}));
