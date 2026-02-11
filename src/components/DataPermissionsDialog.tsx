import { Modal, Pressable } from "react-native";
import { BlurView as BlurView_ } from "expo-blur";
import { ThemedText } from "./themed/ThemedText";
import { ThemedView } from "./themed/ThemedView";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectDataPermissions, setDataPermissions } from "../redux/slices/dataPermissionsSlice";
import { useAppDispatch } from "../hooks/useAppDispatch";

const BlurView = withUnistyles(BlurView_);

const TEXT = `
Wir verwenden Daten, um ihnen ein Optimales Erlebnis zu bieten.
Dazu zählen Daten, die für den Betrieb der Seite notwendig sind, sowie solche, die zu Statistikzwecken, für Komforteinstellungen, oder zur Anzeige personalisierter Inhalte genutzt werden.
Sie können selbst entscheiden, welche Kategorieren sie zulassen möchten.
Bitte beachten sie, dass auf Basis ihrer Einstellungen womöglich nicht mehr alle Funktionalitäten der Seite zur Verfügung stehen
`;

function HorizontalLine() {
  return <ThemedView style={[horizontalLineStyles.color]} />;
}

const horizontalLineStyles = StyleSheet.create((theme) => ({
  color: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
}));

function Row({
  label,
  value,
  onPress,
  disabled,
}: {
  label: string;
  value: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <ThemedView style={rowStyles.container}>
      <ThemedText style={rowStyles.text}>{label}</ThemedText>
      <Pressable onPress={disabled ? undefined : onPress}>
        <AntDesign
          name={value ? "checkcircleo" : "closecircleo"}
          size={24}
          color="black"
        />
      </Pressable>
    </ThemedView>
  );
}

const rowStyles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "30%",
  },
  text: {
    fontWeight: "bold",
  },
}));

export function DataPermissionsDialog() {
  const { accepted, comfort, mandatory, personalised, statistics, hasSeenDialog } =
    useAppSelector(selectDataPermissions);
  const dispatch = useAppDispatch();

  const visible = hasSeenDialog !== true;

  const setPartial = (next: Partial<typeof initialValues>) => {
    dispatch(
      setDataPermissions({
        accepted,
        comfort,
        mandatory: true,
        personalised,
        statistics,
        hasSeenDialog,
        ...next,
      })
    );
  };

  const allesAkzeptieren = () => {
    dispatch(
      setDataPermissions({
        accepted: true,
        comfort: true,
        mandatory: true,
        personalised: true,
        statistics: true,
        hasSeenDialog: true,
      })
    );
  };

  const einstellungenSpeichern = () => {
    dispatch(
      setDataPermissions({
        accepted: true,
        comfort,
        mandatory: true,
        personalised,
        statistics,
        hasSeenDialog: true,
      })
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <BlurView style={styles.blurView}>
        <ThemedView style={styles.contentContainer}>
          <ThemedView>
            <ThemedText style={styles.title}>Wir verwenden Cookies!</ThemedText>
          </ThemedView>

          <ThemedView style={styles.textContainer}>
            <ThemedText style={styles.text}>{TEXT}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.switchesContainer}>
            <Row label="Mandatory" value={true} disabled />
            <HorizontalLine />

            <Row
              label="Comfort"
              value={comfort}
              onPress={() => setPartial({ comfort: !comfort })}
            />
            <HorizontalLine />

            <Row
              label="Personalised"
              value={personalised}
              onPress={() => setPartial({ personalised: !personalised })}
            />
            <HorizontalLine />

            <Row
              label="Statistics"
              value={statistics}
              onPress={() => setPartial({ statistics: !statistics })}
            />
          </ThemedView>

          <ThemedView style={styles.confirmContainer}>
            <Pressable onPress={allesAkzeptieren}>
              <ThemedText>Alles akzeptieren</ThemedText>
            </Pressable>
            <Pressable onPress={einstellungenSpeichern}>
              <ThemedText>Einstellungen speichern</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  blurView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "50%",
    height: "50%",
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "bold",
    fontSize: 24,
  },
  textContainer: {
    margin: 10,
  },
  switchesContainer: {
    gap: 10,
  },
  confirmContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  text: { fontWeight: "bold", }
}));

const initialValues = {
  accepted: false,
  comfort: false,
  mandatory: true,
  personalised: false,
  statistics: false,
  hasSeenDialog: false,
}
;
