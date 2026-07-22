// src/index.tsx
import { DeveloperConsole,DeveloperConsoleConnection,} from "./components/developer-console/DeveloperConsole";
  import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Provider } from "react-redux";
import { UnistylesRuntime, useUnistyles } from "react-native-unistyles";
import { PostLoginUpdateWatcher } from "./redux/slices/PostLoginUpdateWatcher";
import { useSessionActivityWeb } from "./core/authentication/session/useSessionActivityWeb";
import { UpdateNotificationWatcher } from "./redux/slices/UpdateNotificationWatcher";
import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import { DataPermissionsDialog } from "./components/DataPermissionsDialog";

import {
  initializeApi,
  selectIsLoggedIn,
  selectAuthenticationMethod,
} from "./redux/slices/apiSlice";

import { ServerSwitchOverlay } from "./screens/ServerSwitchOverlay";
import { useAppDispatch } from "./hooks/useAppDispatch";
import { useAppSelector } from "./hooks/useAppSelector";
import { useIsWide } from "./hooks/useIsWide";
import { OfflineOverlay } from "./screens/OfflineOverlay";
import { store } from "./redux/store";

import { initializeLanguage } from "./redux/slices/languageSlice";
import { initializeTheme } from "./redux/slices/themeSlice";
import { initializeDataPermissions } from "./redux/slices/dataPermissionsSlice";
import { initializeOrganizations } from "./redux/slices/organizationsSlice";

import { NotificationPopup } from "./components/NotificationPopup";
import { AppSessionGuard } from "./core/authentication/session/AppSessionGuard";
import { LoginScreen } from "./screens/login/Login";
import { DynamicScreen } from "./screens/DynamicScreen";
import { NotAvailableScreen } from "./screens/NotAvailableScreen";
import { InitialPasswordChangeDialog } from "./screens/login/InitialPasswordChangeDialog";

import {
  hasId,
  initializeMenu,
  selectMenu,
  setActiveMenuId,
  isDynamicMenuItem,
} from "./redux/slices/menuSlice";

import { initializeServers } from "./redux/slices/serverSlice";
import { isMenuEnabled } from "./redux/slices/featureFlags";
import { buildMenuPaths } from "./components/routing/menuPaths";
import { Footer } from "./components/Footer";
import { checkAlive } from "./redux/slices/connectivitySlice";

UnistylesRuntime.setAdaptiveThemes(false);
UnistylesRuntime.setTheme("light");

const Drawer = createDrawerNavigator();

function normalizePath(p: string) {
  if (!p) return "/";

  let out = p.trim();

  if (!out.startsWith("/")) {
    out = "/" + out;
  }

  if (out.length > 1) {
    out = out.replace(/\/+$/g, "");
  }

  return out;
}

function getNumericIdFromPath(pathname: string): number | null {
  const seg = String(pathname ?? "")
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+/, "")
    .split("/")[0];

  const n = Number(seg);

  return Number.isFinite(n) && n > 0 ? n : null;
}

function RootStack() {
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

  const [isLoading, setIsLoading] = useState(true);

  /*
   * Wichtig:
   * Der Activity-Hook ruft /api/user/sessionTime/extend auf.
   * Das darf nur bei OIDC laufen.
   *
   * JWT/Base nutzt weiterhin den alten JWT-Renew-Weg.
   */
  useSessionActivityWeb({
    enabled: !isLoading && isLoggedIn && authenticationMethod === "oidc",
  });

  const isWide = useIsWide();
  const { menu, activeMenuId, rawMenu } = useAppSelector(selectMenu);

  const didBootRef = useRef(false);
  const didHandleUrlRef = useRef(false);

  const { pathById, idByPath } = useMemo(
    () => buildMenuPaths(rawMenu),
    [rawMenu],
  );

  const screensConfig = useMemo(() => {
    const out: Record<string, string> = {};

    for (const m of rawMenu) {
      if (!m.menuID) continue;

      const p = pathById[m.menuID];

      if (p) {
        out[String(m.menuID)] = p;
      }
    }

    return out;
  }, [rawMenu, pathById]);

  useEffect(() => {
    if (didBootRef.current) return;

    didBootRef.current = true;

    let alive = true;

    (async () => {
      try {
        await dispatch(initializeServers()).unwrap?.();

        await Promise.all([
          dispatch(initializeLanguage()).unwrap?.(),
          dispatch(initializeTheme()).unwrap?.(),
          dispatch(initializeApi()).unwrap?.(),
          dispatch(initializeDataPermissions()).unwrap?.(),
          dispatch(initializeOrganizations()).unwrap?.(),
        ]);

        await dispatch(initializeMenu()).unwrap?.();
      } catch (e) {
        console.error("BOOT ERROR:", e);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (didHandleUrlRef.current) return;
    if (!rawMenu || rawMenu.length === 0) return;

    didHandleUrlRef.current = true;

    const pathname = normalizePath(window.location.pathname || "/");

    if (pathname === "/login" || pathname === "/base-login") {
      window.history.replaceState(null, "", "/");
      return;
    }

    const slugId = idByPath[pathname];

    if (slugId && isMenuEnabled(slugId)) {
      dispatch(setActiveMenuId(slugId));
      return;
    }

    const numericId = getNumericIdFromPath(pathname);

    if (numericId && isMenuEnabled(numericId)) {
      const slugPath = pathById[numericId];

      if (slugPath) {
        window.history.replaceState(null, "", slugPath);
      }

      dispatch(setActiveMenuId(numericId));
    }
  }, [dispatch, rawMenu, pathById, idByPath]);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) return;
    if (!rawMenu || rawMenu.length === 0) return;

    const pathname = normalizePath(window.location.pathname || "/");

    if (
      pathname === "/login" ||
      pathname === "/base-login" ||
      pathname === "/"
    ) {
      const fallbackId = rawMenu.find(
        (m) => m.menuID && isMenuEnabled(m.menuID),
      )?.menuID;

      const targetId =
        activeMenuId && isMenuEnabled(activeMenuId)
          ? activeMenuId
          : fallbackId;

      if (!targetId) return;

      const targetPath = pathById[targetId];

      if (!targetPath) return;

      window.history.replaceState(null, "", targetPath);
      dispatch(setActiveMenuId(targetId));
    }
  }, [isLoading, isLoggedIn, rawMenu, activeMenuId, pathById, dispatch]);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) return;

    let active = true;

    const runCheck = async () => {
      if (!active) return;

      try {
        await dispatch(checkAlive({ silent: true })).unwrap();
      } catch {
        /*
         * Absichtlich leer:
         * OfflineOverlay liest den Redux-State.
         */
      }
    };

    void runCheck();

    const intervalId = setInterval(() => {
      void runCheck();
    }, 40_000);

    const onFocus = () => {
      void runCheck();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }

    return () => {
      active = false;
      clearInterval(intervalId);

      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [dispatch, isLoading, isLoggedIn]);

  const navigationMenu =
    menu.find((node) => hasId(node, activeMenuId)) ?? menu[0];

  const navTheme = useMemo(
    () => ({
      colors: {
        background: theme.colors.background,
        border: theme.colors.border,
        card: theme.colors.card,
        notification: theme.colors.notification,
        primary: theme.colors.primary,
        text: theme.colors.text,
      },
      dark: false,
      fonts: theme.fonts,
    }),
    [theme],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navTheme}
      linking={{
        prefixes: [Linking.createURL("/")],
        config: {
          screens: {
            ...screensConfig,
            Login: "/login",
            BaseLogin: "/base-login",
            NotFound: "*",
          },
        },
      }}
      fallback={
        <View style={styles.loadingScreen}>
          <ActivityIndicator />
        </View>
      }
    >
      <AppSessionGuard />
      <PostLoginUpdateWatcher enabled={!isLoading && isLoggedIn}/>
    <UpdateNotificationWatcher enabled={!isLoading && isLoggedIn}/>
      <Drawer.Navigator
        screenOptions={{
          drawerType: isWide ? "permanent" : "front",
          drawerStyle: styles.drawer,
          header: (props) => <Header {...props} />,
        }}
        drawerContent={(props) => {
          if (!isLoggedIn) return undefined;

          return (
            <Navigation
              {...props}
              isWide={isWide}
              isLoggedIn={isLoggedIn}
              menu={navigationMenu}
            />
          );
        }}
       screenLayout={({ children }) => (
          <View style={styles.layoutContainer}>
            <DataPermissionsDialog />
            <OfflineOverlay />
            <ServerSwitchOverlay />
            <InitialPasswordChangeDialog />
            <NotificationPopup />

            <DeveloperConsole
              enabled={isLoggedIn}
            >
              {children}
            </DeveloperConsole>
          </View>
        )}
      >
        {isLoggedIn ? (
          <Drawer.Group>
            {rawMenu.map((node, i) => (
              <Drawer.Screen
                key={i}
                name={String(node.menuID!)}
                children={() => {
                  if (!isMenuEnabled(node.menuID!)) {
                    return <NotAvailableScreen />;
                  }

                  if (!isDynamicMenuItem(node) && node.Screen) {
                    const ScreenComp = node.Screen;
                    return <ScreenComp />;
                  }

                  return <DynamicScreen node={node} />;
                }}
                options={{
                  title: process.env.EXPO_PUBLIC_APPLICATION_TITLE,
                }}
              />
            ))}

            <Drawer.Screen
              name="NotFound"
              component={NotAvailableScreen}
              options={{
                title: process.env.EXPO_PUBLIC_APPLICATION_TITLE,
              }}
            />
          </Drawer.Group>
        ) : (
          <Drawer.Group
            screenOptions={{
              swipeEnabled: false,
              drawerStyle: { display: "none" },
              headerShown: false,
            }}
          >
            <Drawer.Screen name="Login" component={LoginScreen} />
          </Drawer.Group>
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <Provider store={store}>
      <DeveloperConsoleConnection />

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <RootStack />
        </View>

        <Footer />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },

  appContent: {
    flex: 1,
    minHeight: 0,
  },

  drawer: {
    width: 200,
  },

  layoutContainer: {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
},

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});