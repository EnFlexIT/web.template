import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { Card } from "./ui-elements/Card";
import { ActionButton } from "./ui-elements/ActionButton";
import { ThemedText } from "./themed/ThemedText";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";
import {
  closeNotificationPopup,
  markAllNotificationsRead,
  markNotificationRead,
  selectLatestNotifications,
  selectNotificationPopupOpen,
  selectUnreadNotificationCount,
   markServerNotificationsRead,
  selectAllNotifications,
} from "../redux/slices/notificationSlice";
import { setActiveMenuId } from "../redux/slices/menuSlice";

const NOTIFICATIONS_MENU_ID = 3015;

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

export function NotificationPopup() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const api = useAppSelector(selectApi);
  const activeServerIp = api.ip;

  const isOpen = useAppSelector(selectNotificationPopupOpen);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const latestNotifications = useAppSelector(selectLatestNotifications(5));

  const [mounted, setMounted] = useState(isOpen);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(12)).current;
  const popupScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(popupTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(popupScale, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(popupTranslateY, {
        toValue: 8,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(popupScale, {
        toValue: 0.985,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [isOpen, backdropOpacity, popupOpacity, popupTranslateY, popupScale]);

  const hasNotifications = latestNotifications.length > 0;

  const subtitle = useMemo(() => {
    if (!hasNotifications) return "Keine neuen Benachrichtigungen";
    if (unreadCount <= 0) return "Alle Benachrichtigungen wurden gelesen";
    if (unreadCount === 1) return "1 ungelesene Benachrichtigung";
    return `${unreadCount} ungelesene Benachrichtigungen`;
  }, [hasNotifications, unreadCount]);

  if (!mounted) return null;

  function onClose() {
    dispatch(closeNotificationPopup());
  }

  function onMarkAllRead() {
  dispatch(markServerNotificationsRead(activeServerIp));
}

  function onMore() {
    dispatch(closeNotificationPopup());
    dispatch(setActiveMenuId(NOTIFICATIONS_MENU_ID));
    navigation.navigate(String(NOTIFICATIONS_MENU_ID));
  }

  function onNotificationPress(item: (typeof latestNotifications)[number]) {
    dispatch(markNotificationRead(item.id));
    dispatch(closeNotificationPopup());

    if (item.action?.type === "navigate" && item.action.menuId) {
      dispatch(setActiveMenuId(item.action.menuId));
      navigation.navigate(String(item.action.menuId));
      return;
    }

    dispatch(setActiveMenuId(NOTIFICATIONS_MENU_ID));
    navigation.navigate(String(NOTIFICATIONS_MENU_ID));
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.popupWrap,
            {
              opacity: popupOpacity,
              transform: [
                { translateY: popupTranslateY },
                { scale: popupScale },
              ],
            },
          ]}
        >
          <Card style={styles.popupCard}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBubble}>
                  <Feather name="bookmark" size={14} color={styles.color.color} />
                </View>

                <View style={styles.headerTextWrap}>
                  <ThemedText style={styles.title}>
                    Benachrichtigungen
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
                </View>
              </View>

              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={16} color={styles.color.color} />
              </Pressable>
            </View>

            <View style={styles.body}>
              {!hasNotifications ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="bookmark" size={18} color={styles.color.color} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>
                    Noch keine Benachrichtigungen
                  </ThemedText>
                  <ThemedText style={styles.emptyText}>
                    Neue Hinweise und wichtige Meldungen erscheinen hier.
                  </ThemedText>
                </View>
              ) : (
                latestNotifications.map((item) => {
                  const tone = getSeverityTone(item.severity);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => onNotificationPress(item)}
                      style={[
                        styles.notificationItem,
                        !item.read && styles.notificationItemUnread,
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

                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeaderRow}>
                          <ThemedText
                            style={[
                              styles.notificationTitle,
                              !item.read && styles.notificationTitleUnread,
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </ThemedText>

                          {!item.read ? <View style={styles.unreadDot} /> : null}
                        </View>

                        <ThemedText
                          style={styles.notificationMessage}
                          numberOfLines={2}
                        >
                          {item.message}
                        </ThemedText>

                        <View style={styles.notificationMetaRow}>
                          <ThemedText style={styles.notificationTime}>
                            {formatTime(item.createdAt)}
                          </ThemedText>

                          {item.action?.type === "navigate" ? (
                            <View style={styles.actionHint}>
                              <Feather
                                name="arrow-right"
                                size={11}
                               color={styles.color.color}
                              />
                              <ThemedText style={styles.actionHintText}>
                                Öffnen
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={styles.footer}>
              <ActionButton
                label="Alle als gelesen"
                variant="secondary"
                size="xs"
                onPress={onMarkAllRead}
                disabled={!hasNotifications || unreadCount === 0}
              />

              <ActionButton
                label="Mehr anzeigen"
                variant="primary"
                size="xs"
                onPress={onMore}
              />
            </View>
          </Card>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  color: {
    color: theme.colors.text,
  },

  backdropPressable: {
    flex: 1,
  },

  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    marginBlockEnd: -200,
  },

  popupWrap: {
    width: "100%",
    maxWidth: 380,
  },

  popupCard: {
    width: "100%",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  headerTextWrap: {
    flex: 1,
  },

  title: {
    fontWeight: "700",
    fontSize: 15,
  },

  subtitle: {
    opacity: 0.65,
    fontSize: 12,
    marginTop: 1,
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    padding: 12,
    gap: 8,
    maxHeight: 380,
  },

  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyIconWrap: {
    width: 36,
    height: 36,
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
    lineHeight: 18,
  },

  notificationItem: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },

  notificationItemUnread: {
    borderColor: theme.colors.primary,
  },

  severityBar: {
    width: 4,
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

  notificationContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },

  notificationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  notificationTitle: {
    flex: 1,
    fontWeight: "600",
  },

  notificationTitleUnread: {
    fontWeight: "700",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#dc2626",
  },

  notificationMessage: {
    opacity: 0.9,
    lineHeight: 18,
  },

  notificationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  notificationTime: {
    opacity: 0.6,
    fontSize: 12,
  },

  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.7,
  },

  actionHintText: {
    fontSize: 12,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));