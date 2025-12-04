import { ThemedView } from "../components/themed/ThemedView";
import { ThemedText } from "../components/themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";
import { useState } from "react";
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
import { setIp } from "../redux/slices/apiSlice";
import { setReady } from "../redux/slices/readySlice";

interface AddServerButtonProps {
  active?: boolean;
  onPress: () => void;
}
function AddServerButton({ active, onPress }: AddServerButtonProps) {
  const [over, setOver] = useState(false);
  styles.useVariants({ over: over, active: active ?? true });

  return (active ?? true) ? (
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
      onPress={function () {
        dispatch(setReady({ ready: true }));
        dispatch(setCurrentOrganization({ name: name }));
        dispatch(setIp(ip));
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
        {Object.entries(organizations).map(([serverName, serverInfo], idx) => {
          return (
            <ServerEntry
              ip={serverInfo.ip_adress}
              name={serverName}
              key={idx}
            />
          );
        })}
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

  return (
    <Modal visible={isVisibile} onRequestClose={() => setIsVisible(false)}>
      <ThemedView style={[styles.modalContainer]}>
        <ThemedView style={[styles.modalWidget, styles.border]}>
          <View style={[styles.inputContainer]}>
            <ThemedText>Name: </ThemedText>
            <ThemedTextInput
              value={serverName}
              onChangeText={setServerName}
              style={styles.border}
            />
          </View>
          <View style={[styles.inputContainer]}>
            <ThemedText>Ip-Adress: </ThemedText>
            <ThemedTextInput
              value={ipAdress}
              onChangeText={setIpAdress}
              style={styles.border}
            />
          </View>
          <AddServerButton
            active={!(serverName === "" || ipAdress === "")}
            onPress={() => {
              setIsVisible(false);
              dispatch(
                addOrganization({
                  name: serverName,
                  organization: {
                    cookie_preference: "",
                    ip_adress: ipAdress,
                    last_jwt: "",
                    last_successful_connection: "",
                  },
                }),
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
  inputContainer: {
    flexDirection: "row",
    // backgroundColor: "red",
    justifyContent: "space-between",
    gap: 15,
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
    // backgroundColor: "red",
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
