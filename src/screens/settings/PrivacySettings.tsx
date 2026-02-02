import { ThemedView } from "../../components/themed/ThemedView";
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
import { Pressable, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { H2 } from "../../components/stylistic/H2";
export function PrivacySettings() {
  const dispatch = useAppDispatch();
  const dataPermissions = useAppSelector(selectDataPermissions);

type PermissionKey = Exclude<keyof DataPermissionsState, "accepted">;

const PERMISSION_KEYS: PermissionKey[] = [
  "statistics",
  "comfort",
  "personalised",
  "mandatory",
];
  const [localDataPermissions, setLocalDataPermissions] =
    useState<DataPermissionsState>({ ...dataPermissions });

  const { t } = useTranslation(["Settings.PrivacySecurity"]);

  return (
    <Screen >
      <View style={styles.container}>
      <H2>{t("privacy_settings_description")}</H2>

                  {/* Permissions Table */}
                  <Table
              data={PERMISSION_KEYS.map((key, idx) => {
                const value = localDataPermissions[key];

                return [
                  <ThemedText key={`k-${idx}`} style={styles.nonSelect}>
                    {t(key)}
                  </ThemedText>,
                  <Pressable
                    key={`v-${idx}`}
                    onPress={
                      key === "mandatory"
                        ? undefined
                        : () => {
                            setLocalDataPermissions((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }));
                          }
                    }
                  >
                    <ThemedText style={styles.nonSelect}>
                      {value ? t("accepted") : t("not_accepted")}
                    </ThemedText>
                  </Pressable>,
                ];
              })}
            />
                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <ActionButton
                      onPress={() => dispatch(setDataPermissions(localDataPermissions))}
                      label={t("apply")}
                    />
                    <ActionButton
                      onPress={() => setLocalDataPermissions({ ...dataPermissions })}
                      label={t("cancel")}
                    />
                  </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 16,
    gap: 12,
  
   
  },
  buttonContainer: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  padding: {
    padding: 5,
  },
  nonSelect: {
    userSelect: "none",
  }
}));
