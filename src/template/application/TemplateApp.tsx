import {
  createDrawerNavigator,
} from "@react-navigation/drawer";

import {
  NavigationContainer,
} from "@react-navigation/native";

import * as Linking from "expo-linking";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  Provider,
} from "react-redux";

import {
  useUnistyles,
} from "react-native-unistyles";

import {
  useAppDispatch,
  useAppSelector,
  useSessionActivityWeb,
} from "@core";

import {
  DataPermissionsDialog,
} from "@design-system";

import {
  AppSessionGuard,
} from "@/template/authentication/session/AppSessionGuard";

import {
  DeveloperConsole,
  DeveloperConsoleConnection,
  DynamicScreen,
  Footer,
  Header,
  InitialPasswordChangeDialog,
  LoginScreen,
  Navigation,
  NotAvailableScreen,
  NotificationPopup,
  OfflineOverlay,
  ServerSwitchOverlay,
  buildMenuPaths,
  checkAlive,
  hasId,
  initializeDataPermissions,
  initializeLanguage,
  initializeMenu,
  initializeOrganizations,
  initializeServers,
  initializeTheme,
  isDynamicMenuItem,
  selectMenu,
  setActiveMenuId,
  useIsWide,
} from "@template";

import {
  initializeApi,
  selectAuthenticationMethod,
  selectIsLoggedIn,
} from "@/template/state/api/apiSlice";

import {
  store,
} from "@/template/state/store/store";

import {
  PostLoginUpdateWatcher,
} from "@/template/update/watchers/PostLoginUpdateWatcher";

import {
  UpdateNotificationWatcher,
} from "@/template/update/watchers/UpdateNotificationWatcher";

import type {
  ApplicationConfig,
} from "@/template/application/ApplicationConfig";

import {
  ApplicationConfigProvider,
} from "@/template/application/ApplicationConfigContext";

type TemplateAppProps<
  TState = unknown,
> = {
  config: ApplicationConfig<TState>;
};

const Drawer =
  createDrawerNavigator();

function normalizePath(
  path: string,
) {
  if (!path) {
    return "/";
  }

  let normalized =
    path.trim();

  if (
    !normalized.startsWith("/")
  ) {
    normalized =
      `/${normalized}`;
  }

  if (
    normalized.length > 1
  ) {
    normalized =
      normalized.replace(
        /\/+$/g,
        "",
      );
  }

  return normalized;
}

function getNumericIdFromPath(
  pathname: string,
): number | null {
  const segment =
    String(
      pathname ?? "",
    )
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "")
      .split("/")[0];

  const numericId =
    Number(segment);

  return (
    Number.isFinite(
      numericId,
    ) &&
    numericId > 0
  )
    ? numericId
    : null;
}

function RootStack<
  TState = unknown,
>({
  config,
}: TemplateAppProps<TState>) {
  const dispatch =
    useAppDispatch();

  const { theme } =
    useUnistyles();

  const isLoggedIn =
    useAppSelector(
      selectIsLoggedIn,
    );

  const authenticationMethod =
    useAppSelector(
      selectAuthenticationMethod,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  /**
   * The session activity endpoint is used only
   * for OIDC authentication.
   *
   * JWT/Base authentication keeps using the
   * existing JWT renewal flow.
   */
  useSessionActivityWeb({
    enabled:
      !isLoading &&
      isLoggedIn &&
      authenticationMethod ===
        "oidc",
  });

  const isWide =
    useIsWide();

  const {
    menu,
    activeMenuId,
    rawMenu,
  } = useAppSelector(
    selectMenu,
  );

  const didBootRef =
    useRef(false);

  const didHandleUrlRef =
    useRef(false);

  /**
   * Resolves menu visibility through the
   * active ApplicationConfig.
   *
   * TemplateApp no longer depends on the
   * legacy Template feature flag module.
   */
  const isConfiguredMenuEnabled =
    useCallback(
      (
        menuID: number,
      ): boolean =>
        config.navigation.menu.isEnabled(
          menuID,
          {
            authenticationMethod,
          },
        ),
      [
        config.navigation.menu,
        authenticationMethod,
      ],
    );

  const {
    pathById,
    idByPath,
  } = useMemo(
    () =>
      buildMenuPaths(
        rawMenu,
      ),
    [rawMenu],
  );

  const screensConfig =
    useMemo(() => {
      const result:
        Record<
          string,
          string
        > = {};

      for (
        const item of
        rawMenu
      ) {
        if (
          !item.menuID
        ) {
          continue;
        }

        const path =
          pathById[
            item.menuID
          ];

        if (path) {
          result[
            String(
              item.menuID,
            )
          ] = path;
        }
      }

      return result;
    }, [
      rawMenu,
      pathById,
    ]);

  useEffect(() => {
    if (
      didBootRef.current
    ) {
      return;
    }

    didBootRef.current =
      true;

    let alive = true;

    const boot =
      async () => {
        try {
          await dispatch(
            initializeServers(),
          ).unwrap?.();

          await Promise.all([
            dispatch(
              initializeLanguage(),
            ).unwrap?.(),

            dispatch(
              initializeTheme(),
            ).unwrap?.(),

            dispatch(
              initializeApi(),
            ).unwrap?.(),

            dispatch(
              initializeDataPermissions(),
            ).unwrap?.(),

            dispatch(
              initializeOrganizations(),
            ).unwrap?.(),
          ]);

          await dispatch(
            initializeMenu(),
          ).unwrap?.();
        } catch (error) {
          console.error(
            "BOOT ERROR:",
            error,
          );
        } finally {
          if (alive) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void boot();

    return () => {
      alive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (
      didHandleUrlRef.current
    ) {
      return;
    }

    if (
      !rawMenu ||
      rawMenu.length === 0
    ) {
      return;
    }

    didHandleUrlRef.current =
      true;

    const pathname =
      normalizePath(
        window.location
          .pathname || "/",
      );

    if (
      pathname === "/login" ||
      pathname ===
        "/base-login"
    ) {
      window.history
        .replaceState(
          null,
          "",
          "/",
        );

      return;
    }

    const slugId =
      idByPath[pathname];

    if (
      slugId &&
      isConfiguredMenuEnabled(
        slugId,
      )
    ) {
      dispatch(
        setActiveMenuId(
          slugId,
        ),
      );

      return;
    }

    const numericId =
      getNumericIdFromPath(
        pathname,
      );

    if (
      numericId &&
      isConfiguredMenuEnabled(
        numericId,
      )
    ) {
      const slugPath =
        pathById[
          numericId
        ];

      if (slugPath) {
        window.history
          .replaceState(
            null,
            "",
            slugPath,
          );
      }

      dispatch(
        setActiveMenuId(
          numericId,
        ),
      );
    }
  }, [
    dispatch,
    rawMenu,
    pathById,
    idByPath,
    isConfiguredMenuEnabled,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn) {
      return;
    }

    if (
      !rawMenu ||
      rawMenu.length === 0
    ) {
      return;
    }

    const pathname =
      normalizePath(
        window.location
          .pathname || "/",
      );

    if (
      pathname === "/login" ||
      pathname ===
        "/base-login" ||
      pathname === "/"
    ) {
      const fallbackId =
        rawMenu.find(
          (item) =>
            Boolean(
              item.menuID,
            ) &&
            isConfiguredMenuEnabled(
              item.menuID,
            ),
        )?.menuID;

      const targetId =
        activeMenuId &&
        isConfiguredMenuEnabled(
          activeMenuId,
        )
          ? activeMenuId
          : fallbackId;

      if (!targetId) {
        return;
      }

      const targetPath =
        pathById[
          targetId
        ];

      if (!targetPath) {
        return;
      }

      window.history
        .replaceState(
          null,
          "",
          targetPath,
        );

      dispatch(
        setActiveMenuId(
          targetId,
        ),
      );
    }
  }, [
    isLoading,
    isLoggedIn,
    rawMenu,
    activeMenuId,
    pathById,
    dispatch,
    isConfiguredMenuEnabled,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn) {
      return;
    }

    let active = true;

    const runCheck =
      async () => {
        if (!active) {
          return;
        }

        try {
          await dispatch(
            checkAlive({
              silent: true,
            }),
          ).unwrap();
        } catch {
          /**
           * OfflineOverlay consumes
           * the corresponding Redux state.
           */
        }
      };

    void runCheck();

    const intervalId =
      setInterval(
        () => {
          void runCheck();
        },
        40_000,
      );

    const onFocus = () => {
      void runCheck();
    };

    if (
      typeof window !==
      "undefined"
    ) {
      window.addEventListener(
        "focus",
        onFocus,
      );
    }

    return () => {
      active = false;

      clearInterval(
        intervalId,
      );

      if (
        typeof window !==
        "undefined"
      ) {
        window.removeEventListener(
          "focus",
          onFocus,
        );
      }
    };
  }, [
    dispatch,
    isLoading,
    isLoggedIn,
  ]);

  const navigationMenu =
    menu.find(
      (node) =>
        hasId(
          node,
          activeMenuId,
        ),
    ) ??
    menu[0];

  const navTheme =
    useMemo(
      () => ({
        colors: {
          background:
            theme.colors
              .background,

          border:
            theme.colors.border,

          card:
            theme.colors.card,

          notification:
            theme.colors
              .notification,

          primary:
            theme.colors
              .primary,

          text:
            theme.colors.text,
        },

        dark: false,
        fonts: theme.fonts,
      }),
      [theme],
    );

  if (isLoading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navTheme}
      linking={{
        prefixes: [
          Linking.createURL(
            "/",
          ),
        ],

        config: {
          screens: {
            ...screensConfig,

            Login:
              "/login",

            BaseLogin:
              "/base-login",

            NotFound: "*",
          },
        },
      }}
      fallback={
        <View
          style={
            styles.loadingScreen
          }
        >
          <ActivityIndicator />
        </View>
      }
    >
      <AppSessionGuard />

      <PostLoginUpdateWatcher
        enabled={
          !isLoading &&
          isLoggedIn
        }
      />

      <UpdateNotificationWatcher
        enabled={
          !isLoading &&
          isLoggedIn
        }
      />

      <Drawer.Navigator
        screenOptions={{
          drawerType:
            isWide
              ? "permanent"
              : "front",

          drawerStyle:
            styles.drawer,

          header: (
            props,
          ) => (
            <Header
              {...props}
            />
          ),
        }}
        drawerContent={(
          props,
        ) => {
          if (!isLoggedIn) {
            return undefined;
          }

          return (
            <Navigation
              {...props}
              isWide={
                isWide
              }
              isLoggedIn={
                isLoggedIn
              }
              menu={
                navigationMenu
              }
            />
          );
        }}
        screenLayout={({
          children,
        }) => (
          <View
            style={
              styles.layoutContainer
            }
          >
            <DataPermissionsDialog />
            <OfflineOverlay />
            <ServerSwitchOverlay />
            <InitialPasswordChangeDialog />
            <NotificationPopup />

            <DeveloperConsole
              enabled={
                isLoggedIn
              }
            >
              {children}
            </DeveloperConsole>
          </View>
        )}
      >
        {isLoggedIn ? (
          <Drawer.Group>
            {rawMenu.map(
              (
                node,
                index,
              ) => (
                <Drawer.Screen
                  key={
                    node.menuID ??
                    index
                  }
                  name={String(
                    node.menuID,
                  )}
                  children={() => {
                    if (
                      !isConfiguredMenuEnabled(
                        node.menuID,
                      )
                    ) {
                      return (
                        <NotAvailableScreen />
                      );
                    }

                    if (
                      !isDynamicMenuItem(
                        node,
                      ) &&
                      node.Screen
                    ) {
                      const ScreenComp =
                        node.Screen;

                      return (
                        <ScreenComp />
                      );
                    }

                    return (
                      <DynamicScreen
                        node={
                          node
                        }
                      />
                    );
                  }}
                  options={{
                    title:
                      config.displayName,
                  }}
                />
              ),
            )}

            <Drawer.Screen
              name="NotFound"
              component={
                NotAvailableScreen
              }
              options={{
                title:
                  config.displayName,
              }}
            />
          </Drawer.Group>
        ) : (
          <Drawer.Group
            screenOptions={{
              swipeEnabled:
                false,

              drawerStyle: {
                display:
                  "none",
              },

              headerShown:
                false,
            }}
          >
            <Drawer.Screen
              name="Login"
              component={
                LoginScreen
              }
            />
          </Drawer.Group>
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function TemplateApp<
  TState = unknown,
>({
  config,
}: TemplateAppProps<TState>) {
  return (
    <ApplicationConfigProvider
      config={config}
    >
      <Provider
        store={store}
      >
        <DeveloperConsoleConnection />

        <View
          style={{
            flex: 1,
          }}
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <RootStack
              config={
                config
              }
            />
          </View>

          <Footer />
        </View>
      </Provider>
    </ApplicationConfigProvider>
  );
}

const styles =
  StyleSheet.create({
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
      justifyContent:
        "center",
      alignItems:
        "center",
    },
  });