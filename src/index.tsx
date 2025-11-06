import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Provider } from "react-redux";
import { Navigation } from "./components/Navigation";
import { useAppDispatch } from "./hooks/useAppDispatch";
import { useAppSelector } from "./hooks/useAppSelector";
import { initializeLanguage } from "./redux/slices/languageSlice";
import { initializeTheme } from "./redux/slices/themeSlice";
import { store } from "./redux/store";
import { LoadingScreen } from "./screens/LoadingScreen";
import { LoginScreen } from "./screens/Login";
import { selectIsLoggedIn, initializeApi } from "./redux/slices/apiSlice";
import { initializeDataPermissions } from "./redux/slices/dataPermissionsSlice";
import { useIsWide } from "./hooks/useIsWide";
import { DataPermissionsDialog } from "./components/DataPermissionsDialog";
import { Header } from "./components/Header";
import {
  hasId,
  initializeMenu,
  selectMenu,
  setActiveMenuId,
} from "./redux/slices/menuSlice";
import { foldl } from "./util/func";
import { MenuItem } from "./redux/slices/menuSlice";
import { DynamicScreen } from "./screens/DynamicScreen";

const Drawer = createDrawerNavigator();

function RootStack() {
  const { theme } = useUnistyles();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useAppDispatch();

  /**
   * Resolve any state that has been cached in Local Storage
   */
  useEffect(function () {
    async function f() {
      await Promise.all([
        dispatch(initializeLanguage()),
        dispatch(initializeTheme()),
        dispatch(initializeApi()),
        dispatch(initializeDataPermissions()),
      ]);
      await dispatch(initializeMenu());
      const id = Number(window.location.pathname.split("/").at(1));
      if (id) {
        await dispatch(setActiveMenuId(id));
      }
      setIsLoading(false);
    }
    f();
  }, []);

  const isWide = useIsWide();

  const { menu, activeMenuId, rawMenu } = useAppSelector(selectMenu);

  const navigationMenu = menu.find((node) => hasId(node, activeMenuId))!;
  /**
   * While the global state has not fully loaded yet, we render something else instead of the router.
   * This way - assuming we are on a nested route a/b/c - we can safely load all of the authentication
   * and then make a decision if we are allowed on a/b/c or not.
   *
   * We check both cases if status is uninitialized or loading because the useEffect above might take some time
   * to start loading and we would wrongfully render the DrawerNavigator instead.
   */
  return isLoading ? (
    <View style={[styles.loadingScreen]}>
      <ActivityIndicator />
    </View>
  ) : (
    <NavigationContainer
      /**
       * We purposefully overwrite the react native theme with the values
       * of the react-native-unistyles theme to achieve matching colors.
       */
      theme={{
        colors: {
          background: theme.colors.background,
          border: theme.colors.border,
          card: theme.colors.card,
          notification: theme.colors.notification,
          primary: theme.colors.primary,
          text: theme.colors.text,
        },
        dark: theme.dark,
        fonts: theme.fonts,
      }}
      linking={{
        /**
         * Configures deeplinks
         */
        prefixes: [Linking.createURL("/")],
        /**
         * Configures matching of url to screen
         */
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
          },
        },
      }}
      /**
       * Screen while deeplinks get resolved
       */
      fallback={
        <View style={[styles.loadingScreen]}>
          <ActivityIndicator />
        </View>
      }
    >
      <Drawer.Navigator
        screenOptions={{
          drawerType: isWide ? "permanent" : "front",
          /**
           * If the Screen is wide enough, we return a function returning undefined. This way the headerLeft stays empty.
           * If there is not sufficient space, we set headerLeft to undefined, which uses the default Implementation
           */
          // headerLeft: isWide ? () => undefined : undefined,
          drawerStyle: [styles.drawer],
          // headerRight: isWide ? () => <ToolBox isLoggedIn={isLoggedIn} /> : undefined,
          header: function (props) {
            return <Header {...props} />;
          },
        }}
        drawerContent={function (props) {
          return isLoggedIn ? (
            <Navigation
              {...props}
              isWide={isWide}
              isLoggedIn={isLoggedIn}
              menu={navigationMenu}
            />
          ) : undefined;
        }}
        /**
         * We define this Screen Layout to enforce the Cookie Dialog on every Screen.
         */
        screenLayout={function ({ children }) {
          return (
            <View style={[styles.layoutContainer]}>
              <DataPermissionsDialog />
              {children}
            </View>
          );
        }}
      >
        {
          /**
           * If User is Logged in, render the Screens that correspond to a logged in experience
           */
          isLoggedIn ? (
            <Drawer.Group>
              {rawMenu.map((node, i) => (
                <Drawer.Screen
                  key={i}
                  name={node.menuID!.toString()}
                  children={function () {
                    return node.Screen ? (
                      <node.Screen />
                    ) : (
                      <DynamicScreen node={node} />
                    );
                  }}
                  options={{
                    title: process.env.EXPO_PUBLIC_APPLICATION_TITLE,
                  }}
                />
              ))}
            </Drawer.Group>
          ) : (
            /**
             * If User is not logged in, render the log-in screen
             */
            <Drawer.Group
              /**
               * For the Login Screen we would like to give the impression, that it is the entire application and there is nothing more to it
               * we achieve this by disabling the drawer by disabling the swipe gesture and setting the drawer style to "none", effectively hiding the drawer.
               */
              screenOptions={{
                swipeEnabled: false,
                drawerStyle: {
                  display: "none",
                },
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
  drawer: {
    width: 200,
  },
  layoutContainer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
