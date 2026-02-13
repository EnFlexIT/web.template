import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { Screen } from "../../components/Screen";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectLanguage, setLanguage } from "../../redux/slices/languageSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { selectThemeInfo, setTheme } from "../../redux/slices/themeSlice";
import { ThemedText } from "../../components/themed/ThemedText";
import { Dropdown } from "../../components/ui-elements/Dropdown";


export function UnauthenticatedSettings() {
  const { t } = useTranslation(["Settings.Unauthenticated"]);

  const language = useAppSelector(selectLanguage);
  const themeInfo = useAppSelector(selectThemeInfo);
   // Dropdown options (typed)
  const languageOptions = {
    de: "Deutsch",
    en: "English",
  } as const;

  const themeOptions = {
    system: t("system"),
    light: t("light"),
    dark: t("dark"),
  } as const;

  const currentThemeValue: keyof typeof themeOptions = themeInfo.adaptive
    ? "system"
    : themeInfo.theme;




  const dispatch = useAppDispatch();

  return (
    <Screen style={[styles.screen]}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={[styles.content]}
      >
        <View style={{ gap: 6 }}>
                        <ThemedText>{t("lng")}:</ThemedText>
                        <Dropdown<"de" | "en">
                          
                          value={(language.language as "de" | "en") ?? "de"}
                          options={languageOptions}
                          onChange={(lng) => dispatch(setLanguage({ language: lng }))}
                          size="xs"
                        />
                      </View>
        
                    
                      <View style={{ gap: 6 }}>
                        <ThemedText>{t("colorscheme")}:</ThemedText>
                        <Dropdown<"system" | "light" | "dark">
                          value={currentThemeValue}
                          options={themeOptions}
                          size="xs"
                          onChange={(v) => {
                            const next =
                              v === "system"
                                ? { adaptive: true, theme: themeInfo.theme }
                                : { adaptive: false, theme: v as "light" | "dark" };
        
                            dispatch(setTheme(next));
                          }}
                        />
                      </View>    
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
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
    
  },
}));