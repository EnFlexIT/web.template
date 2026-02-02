// src/index.tsx
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Provider } from "react-redux";
import { UnistylesRuntime, useUnistyles } from "react-native-unistyles";

import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import { DataPermissionsDialog } from "./components/DataPermissionsDialog";

import { useAppDispatch } from "./hooks/useAppDispatch";
import { useAppSelector } from "./hooks/useAppSelector";
import { useIsWide } from "./hooks/useIsWide";

import { store } from "./redux/store";
import { initializeLanguage } from "./redux/slices/languageSlice";
import { initializeTheme } from "./redux/slices/themeSlice";
import { initializeApi, selectIsLoggedIn } from "./redux/slices/apiSlice";
import { initializeDataPermissions } from "./redux/slices/dataPermissionsSlice";
import {
  initializeOrganizations,
  selectOrganizations,
} from "./redux/slices/organizationsSlice";
import { selectReady } from "./redux/slices/readySlice";

import { LoginScreen } from "./screens/login/Login";
import { DynamicScreen } from "./screens/DynamicScreen";
import { NotAvailableScreen } from "./screens/NotAvailableScreen"; 

import {
  hasId,
  initializeMenu,
  selectMenu,
  setActiveMenuId,
  MenuItem,
  isDynamicMenuItem,
} from "./redux/slices/menuSlice";
import { foldl } from "./util/func";
import { initializeServers } from "./redux/slices/serverSlice";

import { isMenuEnabled } from "./redux/slices/featureFlags"; // ✅ neu (Pfad ggf. anpassen)

/**
 * ✅ Kein Extra-File:
 * Unistyles braucht VOR dem ersten Render ein selected theme,
 * sonst crasht useUnistyles/ThemedText.
 */
UnistylesRuntime.setAdaptiveThemes(false);
UnistylesRuntime.setTheme("light");

const Drawer = createDrawerNavigator();

function RootStack() {
  const dispatch = useAppDispatch();

  // Hook IMMER oben, nie conditional
  const { theme } = useUnistyles();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [isLoading, setIsLoading] = useState(true);
  const isWide = useIsWide();

  const { menu, activeMenuId, rawMenu } = useAppSelector(selectMenu);
  const { ready } = useAppSelector(selectReady);
  const { current_organization } = useAppSelector(selectOrganizations);

  const isReady = Boolean(current_organization && ready);

  useEffect(() => {
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

        // ✅ URL-ID nur setzen, wenn existiert & enabled ist
        const id = Number(window.location.pathname.split("/").at(1));
        if (id) {
          const stateNow = store.getState();
          const exists = stateNow.menu.rawMenu.some((m) => m.menuID === id);

          if (exists && isMenuEnabled(id)) {
            await dispatch(setActiveMenuId(id));
          }
        }
      } catch (e) {
        console.error("BOOT ERROR:", e);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dispatch]);

  const navigationMenu = menu.find((node) => hasId(node, activeMenuId)) ?? menu[0];

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
    [theme]
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
            ...foldl<Record<string, string>, MenuItem>(
              (acc, curr) =>
                Object.defineProperty(acc, "" + curr.menuID!, {
                  value: "/" + curr.menuID!,
                  enumerable: true,
                }),
              {},
              rawMenu
            ),
            Login: "/login",
            BaseLogin: "/base-login",

            //  Catch-all: wenn Route nicht existiert (z.B. /)
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
            {children}
          </View>
        )}
      >
        {isLoggedIn ? (
          <Drawer.Group>
            {rawMenu.map((node, i) => (
              <Drawer.Screen
                key={i}
                name={node.menuID!.toString()}
                children={() => {
                  //  falls ein menuID doch mal disabled reinrutscht
                  if (!isMenuEnabled(node.menuID!)) return <NotAvailableScreen />;

                  if (!isDynamicMenuItem(node) && node.Screen) {
                    const ScreenComp = node.Screen;
                    return <ScreenComp />;
                  }

                  return <DynamicScreen node={node} />;
                }}
                options={{ title: process.env.EXPO_PUBLIC_APPLICATION_TITLE }}
              />
            ))}

            {/*  Fallback Screen für unbekannte Routen */}
            <Drawer.Screen
              name="NotFound"
              component={NotAvailableScreen}
              options={{ title: process.env.EXPO_PUBLIC_APPLICATION_TITLE }}
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
      <RootStack />
    </Provider>
  );
}

const styles = StyleSheet.create({
  drawer: { width: 200 },
  layoutContainer: { flex: 1 },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
});
