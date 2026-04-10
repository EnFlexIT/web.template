import React, { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";
import { H1 } from "../../components/stylistic/H1";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  markServerNotificationsRead,
  markNotificationRead,
  selectAllNotifications,
  selectUnreadNotificationCount,
} from "../../redux/slices/notificationSlice";
import { setActiveMenuId } from "../../redux/slices/menuSlice";
import { selectActiveServerKey } from "../../redux/selectors/serverSelectors";

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getSeverityTone(severity?: string) {
  switch (severity) {
    case "danger":
    case "error":
      return "danger";
    case "warning":
      return "warning";
    case "success":
      return "success";
    default:
      return "info";
  }
}

export function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { t } = useTranslation(["Notifications"]);
  const activeServerKey = useAppSelector(selectActiveServerKey);
  const notifications = useAppSelector(selectAllNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);

  const subtitle = useMemo(() => {
    if (notifications.length === 0) return t("Nonotificationsyet");
    if (unreadCount === 0) return t("Allread");
    if (unreadCount === 1) return t("Oneunread");
    return `${unreadCount} ${t("Unreadnotifications")}`;
  }, [notifications.length, unreadCount]);

  function onMarkAllRead() {
    if (!activeServerKey) return;
    dispatch(markServerNotificationsRead(activeServerKey));
  }

  function onItemPress(item: (typeof notifications)[number]) {
    dispatch(markNotificationRead(item.id));

    if (item.action?.type === "navigate" && item.action.menuId) {
      dispatch(setActiveMenuId(item.action.menuId));
      navigation.navigate(String(item.action.menuId));
    }
  }

  return (
    <Screen>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBubble}>
              <Feather name="bookmark" size={16} color={styles.color.color} />
            </View>

            <View style={styles.headerTextWrap}>
              <H1>{t("Notifications")}</H1>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
          </View>

          <ActionButton
            label={t("Markallasread")}
            size="xs"
            variant="secondary"
            onPress={onMarkAllRead}
            disabled={notifications.length === 0 || unreadCount === 0}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Feather name="bookmark" size={20} color={styles.color.color} />
              </View>

              <ThemedText style={styles.emptyTitle}>
               {t("Nonotificationsyet")}
              </ThemedText>

              <ThemedText style={styles.emptyText}>
                {t("Newhints")}
              </ThemedText>
            </View>
          ) : (
            notifications.map((item) => {
              const tone = getSeverityTone(item.severity);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => onItemPress(item)}
                  style={[
                    styles.item,
                    !item.read && styles.itemUnread,
                  ]}
                >
                  <View
                    style={[
                      styles.severityBar,
                      tone === "info" && styles.severityInfo,
                      tone === "warning" && styles.severityWarning,
                      tone === "danger" && styles.severityDanger,
                      tone === "success" && styles.severitySuccess,
                    ]}
                  />

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <View style={styles.titleWrap}>
                        <ThemedText
                          style={[
                            styles.title,
                            !item.read && styles.titleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </ThemedText>

                        {!item.read ? <View style={styles.dot} /> : null}
                      </View>

                      <ThemedText style={styles.time}>
                        {formatTime(item.createdAt)}
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.message}>
                      {item.message}
                    </ThemedText>

                    <View style={styles.metaRow}>
                      <View style={styles.statusBadge}>
                        <ThemedText style={styles.statusBadgeText}>
                          {item.read ? t("Gelesen") : t("Neu")}
                        </ThemedText>
                      </View>

                      {item.action?.type === "navigate" ? (
                        <View style={styles.openHint}>
                          <ThemedText style={styles.openHintText}>
                            {t("Öffnen")}
                          </ThemedText>
                          <Feather
                            name="arrow-right"
                            size={12}
                            color={styles.color.color}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 16,
    gap: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 220,
  },

  headerTextWrap: {
    flex: 1,
    minWidth: 160,
  },

  subtitle: {
    opacity: 0.7,
    marginTop: 2,
    fontSize: 13,
  },

  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  color: {
    color: theme.colors.text,
  },

  list: {
    gap: 10,
    paddingBottom: 12,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 10,
  },

  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyTitle: {
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 420,
  },

  item: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },

  itemUnread: {
    borderColor: theme.colors.primary,
  },

  severityBar: {
    width: 5,
  },

  severityInfo: {
    backgroundColor: "#3b82f6",
  },

  severityWarning: {
    backgroundColor: "#f59e0b",
  },

  severityDanger: {
    backgroundColor: "#dc2626",
  },

  severitySuccess: {
    backgroundColor: "#10b981",
  },

  itemContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  itemHeader: {
    gap: 6,
  },

  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
  },

  titleUnread: {
    fontWeight: "700",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#dc2626",
  },

  time: {
    opacity: 0.6,
    fontSize: 12,
  },

  message: {
    opacity: 0.92,
    lineHeight: 20,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  statusBadge: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusBadgeText: {
    fontSize: 12,
    opacity: 0.8,
  },

  openHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    opacity: 0.8,
  },

  openHintText: {
    fontSize: 12,
  },
}));