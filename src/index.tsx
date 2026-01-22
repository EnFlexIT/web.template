// src/index.tsx
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Provider } from "react-redux";

import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import { DataPermissionsDialog } from "./components/DataPermissionsDialog";

import { useAppDispatch } from "./hooks/useAppDispatch";
import { useAppSelector } from "./hooks/useAppSelector";
import { useIsWide } from "./hooks/useIsWide";

import { store } from "./redux/store";
import { initializeLanguage } from "./redux/slices/languageSlice";
import { initializeTheme } from "./redux/slices/themeSlice";
import { initializeApi, selectIsLoggedIn, selectIsBaseMode } from "./redux/slices/apiSlice";
import { initializeDataPermissions } from "./redux/slices/dataPermissionsSlice";
import { initializeOrganizations, selectOrganizations } from "./redux/slices/organizationsSlice";
import { selectReady } from "./redux/slices/readySlice";

import { LoginScreen } from "./screens/login/Login";
//import { LoginScreen } from "./screens/BaseModeLoginScreen";
import { ContentContainer } from "./styles/ContentContainer";

import { hasId, initializeMenu, selectMenu, setActiveMenuId, MenuItem } from "./redux/slices/menuSlice";
import { foldl } from "./util/func";
import { DynamicScreen } from "./screens/DynamicScreen";
import { initializeServers } from "./redux/slices/serverSlice";

const Drawer = createDrawerNavigator();

function RootStack() {
  const { theme } = useUnistyles();
  const dispatch = useAppDispatch();
  


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

        const id = Number(window.location.pathname.split("/").at(1));
        if (id) await dispatch(setActiveMenuId(id));

        if (alive) setIsLoading(false);
      } catch (e) {
        console.error("BOOT ERROR:", e);
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dispatch]);


  const navigationMenu = menu.find((node) => hasId(node, activeMenuId)) ?? menu[0];

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
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
      }}
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
              rawMenu,
            ),
            Login: "/login",
            BaseLogin: "/base-login",
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
          // Drawer nur zeigen wenn eingeloggt (egal ob Base oder normal)
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
        
      {
  isLoggedIn ? (
    <Drawer.Group>
      {rawMenu.map((node, i) => (
        <Drawer.Screen
          key={i}
          name={node.menuID!.toString()}
          children={() => (node.Screen ? <node.Screen /> : <DynamicScreen node={node} />)}
          options={{ title: process.env.EXPO_PUBLIC_APPLICATION_TITLE }}
        />
      ))}
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
  )
}
        
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
