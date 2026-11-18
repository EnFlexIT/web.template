import React, { useEffect, useState } from "react";

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

export interface BackendMenuCreateDialogV2Props {
  visible: boolean;
  parentId: number | null;
  parentCaption: string;
  onClose: () => void;
}

export function BackendMenuCreateDialogV2({
  visible,
  parentId,
  parentCaption,
  onClose,
}: BackendMenuCreateDialogV2Props) {
  const { t } = useTranslation(["Editor"]);

  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!visible) {
      setCaption("");
    }
  }, [visible]);

  const isRootMenu = parentId === null;

  const validParent =
    isRootMenu ||
    (Number.isSafeInteger(parentId) && parentId > 0);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      width={520}
    >
      <View style={{ gap: 16 }}>
        <Text
          style={{
            fontSize: 19,
            fontWeight: "600",
          }}
        >
          {t("create.title")}
        </Text>

        <View style={{ gap: 6 }}>
          <Text>
            {t("create.parent")}
          </Text>

          <Text
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#d0d0d0",
              backgroundColor: "#f5f5f5",
            }}
          >
            {isRootMenu
              ? t("create.rootMenu")
              : validParent
                ? parentCaption
                : "-"}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text>
            {t("create.caption")}
          </Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
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
            }}
          />
        </View>

        <View
          style={{
            padding: 12,
            backgroundColor: "#fff7e6",
            borderWidth: 1,
            borderColor: "#f0d59b",
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 5,
            }}
          >
            {t("create.accessRoles")}
          </Text>

          <Text>
            {t("create.accessRolesHint")}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text>
              {t("create.cancel")}
            </Text>
          </Pressable>

          <Pressable
            disabled
            accessibilityState={{ disabled: true }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "#2f80ed",
              opacity: 0.4,
            }}
          >
            <Text style={{ color: "#ffffff" }}>
              {t("create.confirm")}
            </Text>
          </Pressable>
        </View>
      </View>
    </BaseModal>
  );
}