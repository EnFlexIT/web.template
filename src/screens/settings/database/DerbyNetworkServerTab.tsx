import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useUnistyles } from "react-native-unistyles";

import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { H4 } from "../../../components/stylistic/H4";
import { H2 } from "../../../components/stylistic/H2";
import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import {
  fetchDbSettings,
  saveDerbyNetworkServerSettings,
  selectDerbyNetworkServer,
  selectDbSettingsLoading,
  selectDbSettingsSaving,
  selectDbSettingsError,
  setDerbyField,
  clearDbSettingsError,
} from "../../../redux/slices/dbSettingsSlice";

export function DerbyNetworkServerTab() {
  const { theme } = useUnistyles();
  const dispatch = useAppDispatch();

  const derby = useAppSelector(selectDerbyNetworkServer);
  const isLoading = useAppSelector(selectDbSettingsLoading);
  const isSaving = useAppSelector(selectDbSettingsSaving);
  const error = useAppSelector(selectDbSettingsError);

  const [hasRequestedLoad, setHasRequestedLoad] = useState(false);

  useEffect(() => {
    if (!hasRequestedLoad) {
      setHasRequestedLoad(true);
      dispatch(fetchDbSettings());
    }
  }, [dispatch, hasRequestedLoad]);

  const onSave = () => {
    dispatch(
      saveDerbyNetworkServerSettings({
        isStartDerbyNetworkServer: derby.isStartDerbyNetworkServer,
        hostIp: derby.hostIp,
        port: Number(derby.port) || 1527,
        userName: derby.userName,
        password: derby.password,
      }),
    );
  };

  return (
    <Card style={{ height: 600, width: "100%" }} padding="md">
      <H2>Derby Network Server Settings</H2>

      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.border,
          opacity: 0.9,
          marginVertical: 10,
          width: "100%",
        }}
      />

      

      {!!error && (
        <Card padding="sm" style={{ marginBottom: 12 }}>
          <ThemedText>{error}</ThemedText>
        </Card>
      )}

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 30,
          gap: 20,
          height: 390,
        }}
      >
        <Checkbox
          label="Start a Derby database server that is accessible via network"
          value={derby.isStartDerbyNetworkServer}
          onChange={(value) => {
            dispatch(
              setDerbyField({
                key: "isStartDerbyNetworkServer",
                value,
              }),
            );
          }}
        />

        <View style={{ gap: 6 }}>
          <H4>Host or IP</H4>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={derby.hostIp}
                onChangeText={(value) => {
                  dispatch(
                    setDerbyField({
                      key: "hostIp",
                      value,
                    }),
                  );
                }}
                size="sm"
              />
            </View>

            <Pressable
              onPress={() => {
                dispatch(clearDbSettingsError());
              }}
            >
              <AntDesign
                name="edit"
                size={22}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
        </View>

        <TextInput
          label="Port (default: 1527)"
          value={String(derby.port)}
          keyboardType="numeric"
          onChangeText={(value) => {
            const numericValue = value.replace(/[^\d]/g, "");
            dispatch(
              setDerbyField({
                key: "port",
                value: numericValue === "" ? 0 : Number(numericValue),
              }),
            );
          }}
          size="sm"
        />

        <TextInput
          label="User Name"
          value={derby.userName}
          onChangeText={(value) => {
            dispatch(
              setDerbyField({
                key: "userName",
                value,
              }),
            );
          }}
          size="sm"
        />

        <TextInput
          label="Password"
          value={derby.password}
          onChangeText={(value) => {
            dispatch(
              setDerbyField({
                key: "password",
                value,
              }),
            );
          }}
          secureTextEntry
          size="sm"
        />
      </View>

      <View style={{ flexDirection: "row", gap: 15, marginTop:90}}>
         <ActionButton
          label="Test Connection"
          onPress={() => console.log("Test Derby connection")}
          size="sm"
          disabled
        />
        <ActionButton
          label={isSaving ? "Saving..." : "Save"}
          onPress={onSave}
          size="sm"
          disabled={isSaving}
        />

       
      </View>
    </Card>
  );
}