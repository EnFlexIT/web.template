import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

import { Text } from "@/template/components/design-system/stylistic/Text";
import { Dropdown } from "@/template/components/design-system/ui-elements/Dropdown";
import type { LocalContentPreviewNode } from "../adapters/buildLocalContentPreview";

type CreateMode = "folder" | "page";

export interface LocalContentSidebarTreeProps {
  roots: readonly LocalContentPreviewNode[];
  onPagePress?: (pageId: string) => void;
  onCreate?: (mode: CreateMode, parentId: string) => void;
  onManage?: (entryId: string, action: "rename" | "move" | "delete" | "open" | "visibility") => void;
}

interface LocalContentSidebarItemProps
  extends Omit<LocalContentSidebarTreeProps, "roots"> {
  node: LocalContentPreviewNode;
  depth: number;
}

function LocalContentSidebarItem({
  node,
  depth,
  onPagePress,
  onCreate,
  onManage,
}: LocalContentSidebarItemProps) {
  const { theme } = useUnistyles();
  const [expanded, setExpanded] = useState(false);
const isFolder = node.contentPageId === undefined;

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={node.caption}
          accessibilityState={{
            expanded: isFolder ? expanded : undefined,
            disabled: !isFolder && !onPagePress,
          }}
          disabled={!isFolder && !onPagePress}
          onPress={() => {
            if (isFolder) {
              setExpanded(value => !value);
            } else if (node.contentPageId) {
              onPagePress?.(node.contentPageId);
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginLeft: Math.min(depth, 8) * 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: theme.colors.text }}>
            {isFolder ? (expanded ? "▾" : "▸") : " "}
          </Text>
          <Text
            style={{
              color: theme.colors.text,
              flexShrink: 1,
              opacity: node.hidden ? 0.5 : 1,
            }}
          >
            {node.caption}
            {node.hidden ? " (ausgeblendet)" : ""}
          </Text>
          <Text style={{
            color: theme.colors.text,
            opacity: 0.55,
            fontSize: 11,
          }}>

          </Text>
        </Pressable>

                {/* Intelligentes Kontextmenue: nur Ordner koennen Kinder erhalten. */}
        {(onManage || (isFolder && onCreate)) && (
          <Dropdown<string>
            value={onManage ? "open" : "folder"}
            options={{
              ...(isFolder && onCreate
                ? {
                    folder: "Unterordner hinzufügen",
                    page: "Inhaltsseite hinzufügen",
                  }
                : {}),
              ...(onManage
                ? {
                    rename: "Umbenennen",
                    move: "Verschieben",
                    open: "Bearbeiten",
                    visibility: node.hidden ? "Einblenden" : "Ausblenden",
                    delete: "Löschen",
                  }
                : {}),
            }}
            optionIcons={{
              folder: "folder-plus",
              page: "file-plus",
              rename: "edit-2",
              move: "folder",
              open: "external-link",
              visibility: node.hidden ? "eye" : "eye-off",
              delete: "trash-2",
            }}
            destructiveOptions={["delete"]}
            triggerLabel="⋯"
            minimalMenu
            menuPlacement="auto"
            triggerWidth={32}
            hideChevron
            appearance="menu"
            menuWidth={242}
            maxMenuHeight={300}
            size="sm"
            onChange={action => {
              if (action === "folder" || action === "page") {
                if (isFolder) {
                  onCreate?.(action, node.id);
                }
                return;
              }

              if (
                action === "rename" ||
                action === "move" ||
                action === "open" ||
                action === "visibility" ||
                action === "delete"
              ) {
                onManage?.(node.id, action);
              }
            }}
          />
        )}
      </View>

      {isFolder && expanded && node.children.map(child => (
        <LocalContentSidebarItem
          key={child.id}
          node={child}
          depth={depth + 1}
          onPagePress={onPagePress}
          onCreate={onCreate}
          onManage={onManage}
        />
      ))}
    </View>
  );
}

export function LocalContentSidebarTree({
  roots,
  onPagePress,
  onCreate,
  onManage,
}: LocalContentSidebarTreeProps) {
  return (
    <View style={{ gap: 6 }}>
      {roots.map(node => (
        <LocalContentSidebarItem
          key={node.id}
          node={node}
          depth={0}
          onPagePress={onPagePress}
          onCreate={onCreate}
          onManage={onManage}
        />
      ))}
    </View>
  );
}