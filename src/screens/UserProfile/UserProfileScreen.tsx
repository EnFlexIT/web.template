// src/screens/user/UserProfileScreen.tsx

import React, { useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Feather from "@expo/vector-icons/Feather";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectAuthenticationMethod } from "../../redux/slices/apiSlice";
import {
  loadUserProfile,
  selectIsUserProfileLoading,
  selectUserProfile,
  selectUserProfileError,
} from "../../redux/slices/userProfileSlice";

export function UserProfileScreen() {
  const dispatch = useAppDispatch();

  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectIsUserProfileLoading);
  const error = useAppSelector(selectUserProfileError);

  const isOidc = authenticationMethod === "oidc";

  useEffect(() => {
    if (isOidc && !profile) {
      void dispatch(loadUserProfile());
    }
  }, [dispatch, isOidc, profile]);

  const subtitle = useMemo(() => {
    if (!isOidc) return "Fuer diese Anmeldung ist kein Benutzerprofil verfuegbar.";
    if (isLoading) return "Profilinformationen werden geladen.";
    if (profile?.fullName) return `Angemeldet als ${profile.fullName}`;
    return "OpenID Connect Benutzerinformationen";
  }, [isOidc, isLoading, profile?.fullName]);

  function onRefresh() {
    if (!isOidc) return;
    void dispatch(loadUserProfile());
  }

  return (
    <Screen>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Feather name="user" size={18} color={styles.color.color} />
            </View>

            <View style={styles.headerTextWrap}>
              <ThemedText style={styles.title}>User Profile</ThemedText>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
          </View>

          <ActionButton
            label="Aktualisieren"
            size="xs"
            variant="secondary"
            onPress={onRefresh}
            disabled={!isOidc || isLoading}
          />
        </View>

        {!isOidc ? (
          <InfoState
            icon="lock"
            title="Kein Profil verfuegbar"
            text="Ein User Profile wird aktuell nur fuer OpenID Connect angezeigt."
          />
        ) : error ? (
          <InfoState
            icon="alert-triangle"
            title="Profil konnte nicht geladen werden"
            text={error}
            danger
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHeader}>
              <View style={styles.largeAvatar}>
                <Feather name="user" size={28} color={styles.color.color} />
              </View>

              <View style={styles.profileHeaderText}>
                <ThemedText style={styles.profileName}>
                  {profile?.fullName || "Unbekannter Benutzer"}
                </ThemedText>

                <View style={styles.badge}>
                  <Feather name="shield" size={12} color={styles.color.color} />
                  <ThemedText style={styles.badgeText}>
                    OpenID Connect
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.details}>
              <ProfileRow
                icon="user"
                label="Vollstaendiger Name"
                value={profile?.fullName}
              />

              <ProfileRow
                icon="mail"
                label="E-Mail"
                value={profile?.email}
              />

              <ProfileRow
                icon="corner-down-right"
                label="Vorname"
                value={profile?.givenName}
              />

              <ProfileRow
                icon="users"
                label="Nachname"
                value={profile?.familyName}
              />
            </View>
          </ScrollView>
        )}
      </Card>
    </Screen>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={15} color={styles.color.color} />
      </View>

      <View style={styles.rowContent}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        <ThemedText style={styles.rowValue}>{value || "-"}</ThemedText>
      </View>
    </View>
  );
}

function InfoState({
  icon,
  title,
  text,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, danger && styles.emptyIconDanger]}>
        <Feather
          name={icon}
          size={20}
          color={danger ? "#dc2626" : styles.color.color}
        />
      </View>

      <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
      <ThemedText style={[styles.emptyText, danger && styles.errorText]}>
        {text}
      </ThemedText>
    </View>
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

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  subtitle: {
    opacity: 0.7,
    marginTop: 2,
    fontSize: 13,
  },

  avatar: {
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

  content: {
    gap: 14,
    paddingBottom: 12,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  largeAvatar: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  profileHeaderText: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "700",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 12,
    opacity: 0.8,
  },

  details: {
    gap: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  rowContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },

  rowLabel: {
    fontSize: 12,
    opacity: 0.65,
  },

  rowValue: {
    fontSize: 15,
    fontWeight: "600",
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

  emptyIconDanger: {
    borderColor: "#dc2626",
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

  errorText: {
    color: "#dc2626",
    opacity: 1,
  },
}));