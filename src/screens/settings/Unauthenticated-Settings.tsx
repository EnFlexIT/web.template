import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { Screen } from "../../components/Screen";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectLanguage, setLanguage } from "../../redux/slices/languageSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import {
  selectTheme,
  setTheme,
  themeSlice,
} from "../../redux/slices/themeSlice";
import { ThemedText } from "../../components/themed/ThemedText";
import { ThemedTextInput } from "../../components/themed/ThemedTextInput";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { selectIp, setIp } from "../../redux/slices/apiSlice";
import { useState } from "react";
import { useRoute } from "@react-navigation/native";

export function UnauthenticatedSettings() {
  const { t } = useTranslation(["Settings.Unauthenticated"]);

  const language = useAppSelector(selectLanguage);
  const theme = useAppSelector(selectTheme);
  const ip = useAppSelector(selectIp);

  const [ipField, setIpField] = useState(ip);

  const dispatch = useAppDispatch();

  return (
    <Screen style={[styles.screen]}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={[styles.content]}
      >
        <View style={[styles.noStretchChildren]}>
          <ThemedText>{t("lng")}:</ThemedText>
          <Picker
            selectedValue={language.language}
            onValueChange={(itemValue) =>
              dispatch(
                setLanguage({
                  language: itemValue,
                })
              )
            }
          >
            <Picker.Item label="Deutsch" value="de" />
            <Picker.Item label="Englisch" value="en" />
          </Picker>
        </View>
        <View style={[styles.noStretchChildren]}>
          <ThemedText>{t("colorscheme")}:</ThemedText>
          <Picker
            selectedValue={theme.val.adaptive ? "system" : theme.val.theme}
            onValueChange={(itemValue) => {
              dispatch(
                setTheme({
                  val: {
                    adaptive: itemValue === "system" ? true : false,
                    theme: itemValue === "system" ? theme.val.theme : itemValue,
                  },
                })
              );
            }}
          >
            <Picker.Item label={t("system")} value="system" />
            <Picker.Item label={t("light")} value="light" />
            <Picker.Item label={t("dark")} value="dark" />
          </Picker>
        </View>
        <View style={[styles.ip]}>
          <ThemedText>IP:</ThemedText>
          <StylisticTextInput
            value={ipField}
            style={[styles.border, styles.padding]}
            onChangeText={async function (text) {
              setIpField(text);
            }}
            onSubmitEditing={function ({ nativeEvent: { text } }) {
              dispatch(setIp(text));
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
  },
  container: {
    margin: 10,
  },
  content: {
    flex: 1,
    gap: 20,
  },
  noStretchChildren: {
    alignItems: "flex-start",
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padding: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    color: UnistylesRuntime.getTheme("light").colors.text,
  },
  ip: {
    maxWidth: 700,
  },
}));
