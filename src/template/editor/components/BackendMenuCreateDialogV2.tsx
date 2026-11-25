import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";

import {
  BaseModal,
} from "@/template/components/design-system/ui-elements/BaseModal";

// P02C_CREATE_DIALOG_V1

export interface BackendMenuCreateDialogV2Props {
  visible: boolean;
  parentId: number | null;
  parentCaption: string;
  onClose: () => void;
  loading?: boolean;
  parentError?: string;
  availableRoles?: readonly string[];
  onSubmit?: (
    caption: string,
    allowedRoles: readonly string[],
  ) => Promise<void>;
}

export function BackendMenuCreateDialogV2({
  visible,
  parentId,
  parentCaption,
  onClose,
  loading = false,
  parentError = "",
  availableRoles = [],
  onSubmit,
}: BackendMenuCreateDialogV2Props) {
  const { t } = useTranslation(["Editor"]);

  const [caption, setCaption] = useState("");
  const [selectedRoles, setSelectedRoles] =
    useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);

  const actionLock = useRef(false);

  useEffect(() => {
    if (!visible && !actionLock.current) {
      setCaption("");
      setSelectedRoles([]);
      setError("");
      setAttempted(false);
    }
  }, [visible]);

  const isRootMenu = parentId === null;

  const validParent =
    isRootMenu ||
    (
      Number.isSafeInteger(parentId) &&
      parentId > 0 &&
      parentCaption.trim().length > 0
    );

  const roles = Array.from(
    new Set(
      availableRoles.filter(
        role =>
          typeof role === "string" &&
          role.trim().length > 0,
      ),
    ),
  );

  const validRoles =
    selectedRoles.length > 0 &&
    selectedRoles.every(role => roles.includes(role));

  const validCaption =
    caption.trim().length > 0 &&
    caption.trim().length <= 120;

  const inputDisabled =
    busy || loading || attempted;

  const disabled =
    !visible ||
    inputDisabled ||
    !validParent ||
    !validCaption ||
    !validRoles ||
    parentError.length > 0 ||
    typeof onSubmit !== "function";

  function closeDialog() {
    if (actionLock.current || busy) return;
    onClose();
  }

  function toggleRole(role: string) {
    if (actionLock.current || inputDisabled) return;
    if (!roles.includes(role)) return;

    setSelectedRoles(previous =>
      previous.includes(role)
        ? previous.filter(item => item !== role)
        : [...previous, role],
    );
  }

  async function submit() {
    if (
      actionLock.current ||
      disabled ||
      !onSubmit
    ) return;

    actionLock.current = true;

    setBusy(true);
    setAttempted(true);
    setError("");

    try {
      await onSubmit(
        caption.trim(),
        [...selectedRoles],
      );

      onClose();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "";

      const knownKeys = [
        "create.sessionChanged",
        "create.permissionDenied",
        "create.invalidRoles",
        "create.invalidParent",
        "create.invalidPositions",
        "create.refreshFailed",
        "create.verificationFailed",
      ];

      if (knownKeys.includes(message)) {
        setError(message);
      } else if (
        message.includes("could not be verified") ||
        message.includes("Unable to verify") ||
        message.includes("existing menu ID")
      ) {
        setError("create.verificationFailed");
      } else {
        setError("create.failed");
      }
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }

  return (
    <BaseModal
      visible={visible}
      onClose={closeDialog}
      width={520}
    >
      <View style={{ gap: 16 }}>
        <Text style={{
          fontSize: 19,
          fontWeight: "600",
        }}>
          {t("create.title")}
        </Text>

        <View style={{ gap: 6 }}>
          <Text>{t("create.parent")}</Text>

          <Text style={{
            padding: 12,
            borderWidth: 1,
            borderColor: "#d0d0d0",
            backgroundColor: "#f5f5f5",
            color: "#111111",
          }}>
            {loading
              ? t("create.loading")
              : isRootMenu
                ? t("create.rootMenu")
                : validParent
                  ? parentCaption
                  : "-"}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text>{t("create.caption")}</Text>

          <TextInput
            testID="create-menu-caption"
            value={caption}
            onChangeText={setCaption}
            editable={!inputDisabled}
            placeholder={t("create.captionPlaceholder")}
            maxLength={120}
            style={{
              borderWidth: 1,
              borderColor: "#d0d0d0",
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              backgroundColor: "#ffffff",
              color: "#111111",
              opacity: inputDisabled ? 0.6 : 1,
            }}
          />

          <Text style={{
            fontSize: 12,
            textAlign: "right",
          }}>
            {caption.length}/120
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text>
            {t("create.position")}
          </Text>

          <Text>
            {t("create.appendPosition")}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>
            {t("create.accessRoles")}
          </Text>

          {roles.length === 0 ? (
            <Text>
              {t("create.rolesUnavailable")}
            </Text>
          ) : (
            roles.map(role => {
              const checked =
                selectedRoles.includes(role);

              return (
                <Pressable
                  key={role}
                  testID={`create-role-${role}`}
                  accessibilityRole="checkbox"
                  accessibilityLabel={role}
                  accessibilityState={{
                    checked,
                    disabled: inputDisabled,
                  }}
                  disabled={inputDisabled}
                  onPress={() => toggleRole(role)}
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderColor: checked
                      ? "#2463eb"
                      : "#d0d0d0",
                    borderRadius: 6,
                  }}
                >
                  <Text>
                    {checked ? "[x] " : "[ ] "}
                    {role}
                  </Text>
                </Pressable>
              );
            })
          )}

          {roles.length > 0 && !validRoles && (
            <Text>
              {t("create.selectRole")}
            </Text>
          )}
        </View>

        {(parentError || error) !== "" && (
          <Text
            testID="create-menu-error"
            accessibilityRole="alert"
            style={{ color: "#b42318" }}
          >
            {parentError || (error ? t(error) : "")}
          </Text>
        )}

        {attempted && !busy && error !== "" && (
          <Text>
            {t("create.retryWarning")}
          </Text>
        )}

        <View style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 12,
        }}>
          <Pressable
            testID="create-menu-cancel"
            disabled={busy}
            onPress={closeDialog}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text>{t("create.cancel")}</Text>
          </Pressable>

          <Pressable
            testID="create-menu-confirm"
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => void submit()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "#2463eb",
              borderRadius: 6,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Text style={{ color: "#ffffff" }}>
              {busy
                ? t("create.saving")
                : t("create.confirm")}
            </Text>
          </Pressable>
        </View>
      </View>
    </BaseModal>
  );
}
