import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "../../components/Screen";
import { Table } from "../../components/Table";
import { TableSwitchCell } from "../../components/ui-elements/TableSwitchCell";
import { ThemedText } from "../../components/themed/ThemedText";
import { H4 } from "../../components/stylistic/H4";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import { PERMISSIONS } from "../../permissions/PermiossionGroup";
import {
  selectPermissionValues,
  setPermissionValue,
  acceptAll,
  rejectOptional,
} from "../../redux/slices/dataPermissionsSlice";

export function PrivacySettings() {
  const dispatch = useAppDispatch();
const { t } = useTranslation(["Settings.PrivacySecurity"]);


  const values = useAppSelector(selectPermissionValues);

 
  const allAccepted = PERMISSIONS
    .filter((p) => p.editable)
    .every((p) => values[p.id] === true);

  return (
    <Screen>
      <View style={styles.container}>
        <H4>{t("privacy_settings_description")}</H4>

        <Table
          columnFlex={[5, 1]}
          data={[
            ...PERMISSIONS.map((p, idx) => {
              const value = values[p.id] ?? p.defaultValue;

             
              const disabled = !p.editable;

              return [
                <View key={`left-${idx}`} style={styles.leftCell}>
                <ThemedText style={styles.title}>
                {t(p.titleKey)}
                </ThemedText>

                <ThemedText style={styles.description}>
                {t(p.descriptionKey)}
               </ThemedText>
                </View>,

                <View key={`right-${idx}`} style={styles.rightCell}>
                  <TableSwitchCell
                    value={value}
                    disabled={disabled}
                    onChange={(next) => {
                      if (disabled) return;
                      dispatch(setPermissionValue({ id: p.id, value: next }));
                    }}
                  />
                </View>,
              ];
            }),

            // Accept all (optional-only)
            [
              <View key="accept-all-left" style={styles.leftCell}>
                <ThemedText style={[styles.title, styles.nonSelect]}>
                  {t("accept_all")}
                </ThemedText>
                <ThemedText style={[styles.description, styles.nonSelect]} />
              </View>,

              <View key="accept-all-right" style={styles.rightCell}>
                <TableSwitchCell
                  value={allAccepted}
                  onChange={(next) => {
                    dispatch(next ? acceptAll() : rejectOptional());
                  }}
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
    flexShrink: 10,
  },
  rightCell: {},
}));
