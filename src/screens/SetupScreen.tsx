import { ThemedView } from "../components/themed/ThemedView";
import { ThemedText } from "../components/themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";
import { useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { ThemedAntDesign } from "../components/themed/ThemedAntDesign";
import { ThemedTextInput } from "../components/themed/ThemedTextInput";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  addOrganization,
  selectOrganizations,
  setCurrentOrganization,
} from "../redux/slices/organizationsSlice";
import { useAppSelector } from "../hooks/useAppSelector";
//import { setIpLocal } from "../redux/slices/apiSlice";
import { setReady } from "../redux/slices/readySlice";
import { foldl } from "../util/func";

// ✅ WICHTIG: so wie in deinem apiSlice
import {
  Configuration as RestApiConfiguration,
  InfoApi,
} from "../api/implementation/AWB-RestAPI";

function normalizeBaseUrl(input: string) {
  const trimmed = input.trim();

  // erlaubt Eingabe ohne http(s)
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `http://${trimmed}`;

  // trailing slash entfernen
  return withProtocol.replace(/\/+$/, "");
}

interface AddServerButtonProps {
  active?: boolean;
  onPress: () => void;
}
function AddServerButton({ active, onPress }: AddServerButtonProps) {
  const [over, setOver] = useState(false);
  styles.useVariants({ over: over, active: active ?? true });

  return active ?? true ? (
    <Pressable
      onHoverIn={() => setOver(true)}
      onHoverOut={() => setOver(false)}
      onPress={onPress}
    >
      <ThemedView
        style={[styles.width, styles.addServerButtonContainer, styles.border]}
      >
        <ThemedAntDesign name="plus" />
        <ThemedText>Add Server</ThemedText>
      </ThemedView>
    </Pressable>
  ) : (
    <ThemedView
      style={[styles.width, styles.addServerButtonContainer, styles.border]}
    >
      <ThemedAntDesign name="plus" />
      <ThemedText>Add Server</ThemedText>
    </ThemedView>
  );
}

interface ServerEntryProps {
  name: string;
  ip: string;
}
function ServerEntry({ name, ip }: ServerEntryProps) {
  const [over, setOver] = useState(false);
  styles.useVariants({ overServerEntry: over });
  const dispatch = useAppDispatch();

  return (
    <Pressable
      onHoverIn={() => setOver(true)}
      onHoverOut={() => setOver(false)}
      onPress={() => {
        dispatch(setReady({ ready: true }));
        dispatch(setCurrentOrganization({ name }));
       // dispatch(setIpLocal( ip ));

      }}
    >
      <ThemedView style={[styles.serverEntryContainer, styles.border]}>
        <ThemedText>{name}</ThemedText>
        <ThemedText>{ip}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function SetupScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { organizations } = useAppSelector(selectOrganizations);

  return (
    <ThemedView style={[styles.container]}>
      <AddServerModal
        isVisibile={isModalVisible}
        setIsVisible={setIsModalVisible}
      />

      <ThemedView style={[styles.widget]}>
        {Object.entries(organizations).map(([serverName, serverInfo], idx) => (
          <ServerEntry
            ip={serverInfo.ip_adress}
            name={serverName}
            key={idx}
          />
        ))}
        <AddServerButton onPress={() => setIsModalVisible(true)} />
      </ThemedView>
    </ThemedView>
  );
}

interface AddServerModalProps {
  isVisibile: boolean;
  setIsVisible: (_: boolean) => void;
}

function AddServerModal({ isVisibile, setIsVisible }: AddServerModalProps) {
  const [serverName, setServerName] = useState("");
  const [ipAdress, setIpAdress] = useState("");
  const dispatch = useAppDispatch();

  const [ipAdressStatus, setIpAdressValid] = useState<
    "dirty" | "valid" | "unvalid"
  >("dirty");

  async function checkServerValidity() {
    try {
      if (!ipAdress.trim()) {
        setIpAdressValid("unvalid");
        return;
      }

      const baseUrl = normalizeBaseUrl(ipAdress);

      // ✅ check genau wie apiSlice: `${ip}/api`
      const infoApi = new InfoApi({
        isJsonMime: new RestApiConfiguration().isJsonMime,
        basePath: `${baseUrl}/api`,
      });

      const res = await infoApi.getAppSettings();

      if (res.status === 200) {
        setIpAdressValid("valid");
      } else {
        setIpAdressValid("unvalid");
      }
    } catch (e) {
      setIpAdressValid("unvalid");
    }
  }

  const table = useMemo(() => {
    return [
      [
        <ThemedText key="n-label">Name:</ThemedText>,
        <ThemedTextInput
          key="n-input"
          value={serverName}
          onChangeText={setServerName}
          style={styles.border}
        />,
      ],
      [
        <ThemedText key="ip-label">Ip-Adress:</ThemedText>,
        <ThemedTextInput
          key="ip-input"
          value={ipAdress}
          onChangeText={(text) => {
            setIpAdressValid("dirty");
            setIpAdress(text);
          }}
          style={[styles.border]}
        />,
        ipAdressStatus === "dirty" ? (
          <Pressable key="ip-check" onPress={checkServerValidity}>
            <ThemedText>Check Validity</ThemedText>
          </Pressable>
        ) : ipAdressStatus === "valid" ? (
          <ThemedAntDesign key="ip-ok" name="check" />
        ) : (
          <ThemedAntDesign
            key="ip-bad"
            name="close"
            style={[{ color: "red" }]}
          />
        ),
      ],
    ];
  }, [serverName, ipAdress, ipAdressStatus]);

  const longestRow = foldl(
    (acc, curr) => (curr > acc ? curr : acc),
    0,
    table.map((val) => val.length)
  );

  const canAdd =
    serverName.trim() !== "" &&
    ipAdress.trim() !== "" &&
    ipAdressStatus === "valid";

  return (
    <Modal visible={isVisibile} onRequestClose={() => setIsVisible(false)}>
      <ThemedView style={[styles.modalContainer]}>
        <ThemedView style={[styles.modalWidget, styles.border]}>
          <View style={{ gap: 10 }}>
            {table.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                {row.map((column, columnIdx) => (
                  <View
                    key={columnIdx}
                    style={{ width: `${(1 / longestRow) * 100}%` }}
                  >
                    {column}
                  </View>
                ))}
              </View>
            ))}
          </View>

          <AddServerButton
            active={canAdd}
            onPress={() => {
              if (!canAdd) return;

              const baseUrl = normalizeBaseUrl(ipAdress);

              setIsVisible(false);
              dispatch(
                addOrganization({
                  name: serverName,
                  organization: {
                    cookie_preference: "",
                    ip_adress: baseUrl, // ✅ normalisiert speichern
                    last_jwt: "",
                    last_successful_connection: "",
                  },
                })
              );
            }}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalWidget: {
    gap: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  widget: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  width: {
    minWidth: 200,
  },
  addServerButtonContainer: {
    backgroundColor: theme.colors.card,
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-evenly",
    variants: {
      over: {
        true: {
          backgroundColor: theme.colors.highlight,
        },
      },
      active: {
        false: {
          backgroundColor: theme.colors.highlight,
        },
      },
    },
  },
  serverEntryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    gap: 50,
    backgroundColor: theme.colors.card,
    variants: {
      overServerEntry: {
        true: {
          backgroundColor: theme.colors.highlight,
        },
      },
    },
  },
}));
