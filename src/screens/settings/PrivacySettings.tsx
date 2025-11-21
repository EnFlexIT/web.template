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
import { Pressable } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ButtonProps {
  onPress: () => void;
  text: string;
}
function Button({ onPress, text }: ButtonProps) {
  const [over, setOver] = useState(false);
  styles.useVariants({ over: over });
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setOver(true)}
      onHoverOut={() => setOver(false)}
    >
      <ThemedText
        style={[
          styles.border,
          styles.padding,
          styles.nonSelect,
          styles.buttonText,
        ]}
      >
        {text}
      </ThemedText>
    </Pressable>
  );
}

export function PrivacySettings() {
  const dispatch = useAppDispatch();
  const dataPermissions = useAppSelector(selectDataPermissions);

  const [localDataPermissions, setLocalDataPermissions] =
    useState<DataPermissionsState>({ ...dataPermissions });

  const { t } = useTranslation(["Settings.PrivacySecurity"]);

  return (
    <Screen style={[styles.container]}>
      <ThemedText>{t("privacy_settings_description")}</ThemedText>
      <Table
        data={Object.entries(localDataPermissions)
          // Filter out the 'accepted' field
          .filter(([key]) => key !== "accepted")
          .map(([key, value], idx) => {
            return [
              <ThemedText key={2 * idx} style={styles.nonSelect}>
                {t(key)}
              </ThemedText>,
              <Pressable
                // We want to exclude mandatory field from being editable
                onPress={
                  key === "mandatory"
                    ? undefined
                    : function () {
                        let dataPerms = localDataPermissions;
                        dataPerms[key] = !localDataPermissions[key];
                        setLocalDataPermissions({ ...dataPerms });
                      }
                }
              >
                <ThemedText key={2 * idx + 1} style={styles.nonSelect}>
                  {value ? t("accepted") : t("not_accepted")}
                </ThemedText>
              </Pressable>,
            ];
          })}
      />
      <ThemedView style={[styles.buttonContainer]}>
        <Button
          onPress={() => dispatch(setDataPermissions(localDataPermissions))}
          text={t("apply")}
        />
        <Button
          onPress={() => setLocalDataPermissions({ ...dataPermissions })}
          text={t("cancel")}
        />
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 10,
  },
  buttonContainer: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padding: {
    padding: 5,
  },
  nonSelect: {
    userSelect: "none",
  },
  buttonText: {
    variants: {
      over: {
        true: {
          color: theme.colors.highlight,
        },
      },
    },
  },
}));
