import {
  createDrawerNavigator,
} from "@react-navigation/drawer";

import {
  NavigationContainer,
  useNavigationContainerRef,
  type ParamListBase,
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
  useSessionActivityWeb,
} from "@/template/authentication/session/useSessionActivityWeb";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

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

import type {
  TemplateStore,
} from "@/template/state/store/types";

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


type RootStackProps<
  TState = unknown,
> = {
  config:
    ApplicationConfig<TState>;
};


type TemplateAppProps<
  TState = unknown,
> =
  RootStackProps<TState> & {
    store:
      TemplateStore;
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
    !normalized.startsWith(
      "/",
    )
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
      .replace(
        /^\/+/,
        "",
      )
      .split("/")[0];

  const numericId =
    Number(
      segment,
    );

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
}: RootStackProps<TState>) {
  const dispatch =
    useAppDispatch();

  /**
   * React Navigation owns the actually rendered screen.
   *
   * Redux and the browser URL alone are not enough to
   * switch the visible Drawer screen reliably.
   */
  const navigationRef =
    useNavigationContainerRef<
      ParamListBase
    >();

  const [
    isNavigationReady,
    setIsNavigationReady,
  ] =
    useState(false);

  const {
    theme,
  } =
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
  ] =
    useState(true);

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
  } =
    useAppSelector(
      selectMenu,
    );

  const didBootRef =
    useRef(false);

  const didHandleUrlRef =
    useRef(false);

  /**
   * Tracks whether the Application has been in
   * the logged-out state.
   *
   * After a real login the configured default
   * menu must win over an old browser URL.
   */
  const wasLoggedOutRef =
    useRef(
      !isLoggedIn,
    );

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
        config.navigation.menu
          .isEnabled(
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
  } =
    useMemo(
      () =>
        buildMenuPaths(
          rawMenu,
        ),
      [
        rawMenu,
      ],
    );

  const screensConfig =
    useMemo(
      () => {
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
            ] =
              path;
          }
        }

        return result;
      },
      [
        rawMenu,
        pathById,
      ],
    );

  /**
   * Initial Application boot.
   */
  useEffect(() => {
    if (
      didBootRef.current
    ) {
      return;
    }

    didBootRef.current =
      true;

    let alive =
      true;

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
        } catch (
          error
        ) {
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
      alive =
        false;
    };
  }, [
    dispatch,
  ]);

  /**
   * Handles an explicit URL once when the
   * Application initially starts.
   *
   * This keeps normal deep links working.
   *
   * A later real login is handled separately
   * and may intentionally override this URL
   * with NavigationDefaultMenu.
   */
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
      idByPath[
        pathname
      ];

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

  /**
   * Opens the configured default menu after
   * an actual login.
   *
   * Important:
   *
   * Redux activeMenuId,
   * React Navigation,
   * and the browser URL
   *
   * must all point to the same menu.
   *
   * When the Application is already authenticated
   * and opened with an explicit deep link, that
   * deep link remains untouched.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn) {
      wasLoggedOutRef.current =
        true;

      return;
    }

    if (
      !rawMenu ||
      rawMenu.length === 0 ||
      !isNavigationReady
    ) {
      return;
    }

    const pathname =
      normalizePath(
        window.location
          .pathname || "/",
      );

    const justLoggedIn =
      wasLoggedOutRef.current;

    const shouldOpenDefaultMenu =
      justLoggedIn ||
      pathname === "/login" ||
      pathname ===
        "/base-login" ||
      pathname === "/";

    if (
      !shouldOpenDefaultMenu
    ) {
      return;
    }

    const configuredDefaultMenuID =
      config.navigation.menu
        .defaultMenuID;

    const defaultMenuID =
      configuredDefaultMenuID !==
        undefined &&
      rawMenu.some(
        (item) =>
          item.menuID ===
          configuredDefaultMenuID,
      ) &&
      isConfiguredMenuEnabled(
        configuredDefaultMenuID,
      )
        ? configuredDefaultMenuID
        : undefined;

    /**
     * Fallback is used only when an Application
     * has no usable NavigationDefaultMenu.
     */
    const fallbackMenuID =
      rawMenu.find(
        (item) =>
          Boolean(
            item.menuID,
          ) &&
          isConfiguredMenuEnabled(
            item.menuID,
          ),
      )?.menuID;

    const targetMenuID =
      defaultMenuID ??
      fallbackMenuID;

    if (
      !targetMenuID
    ) {
      return;
    }

    const targetPath =
      pathById[
        targetMenuID
      ];

    if (
      !targetPath
    ) {
      return;
    }

    /**
     * Consume the login transition before
     * synchronizing navigation.
     */
    wasLoggedOutRef.current =
      false;

    /**
     * 1. Redux state
     */
    dispatch(
      setActiveMenuId(
        targetMenuID,
      ),
    );

    /**
     * 2. Actual React Navigation route
     *
     * Drawer.Screen names are generated from
     * String(menuID), therefore "3003" resolves
     * directly to the Settings screen.
     */
    navigationRef
      .resetRoot({
        index: 0,

        routes: [
          {
            name:
              String(
                targetMenuID,
              ),
          },
        ],
      });

    /**
     * 3. Browser URL
     */
    if (
      typeof window !==
        "undefined"
    ) {
      window.history
        .replaceState(
          null,
          "",
          targetPath,
        );
    }
  }, [
    isLoading,
    isLoggedIn,
    rawMenu,
    pathById,
    dispatch,
    isConfiguredMenuEnabled,
    config.navigation.menu
      .defaultMenuID,
    navigationRef,
    isNavigationReady,
  ]);

  const navigationMenu =
    activeMenuId !==
      undefined
      ? (
          menu.find(
            (node) =>
              hasId(
                node,
                activeMenuId,
              ),
          ) ??
          menu[0]
        )
      : menu[0];

  const navTheme =
    useMemo(
      () => ({
        colors: {
          background:
            theme.colors
              .background,

          border:
            theme.colors
              .border,

          card:
            theme.colors
              .card,

          notification:
            theme.colors
              .notification,

          primary:
            theme.colors
              .primary,

          text:
            theme.colors
              .text,
        },

        dark:
          false,

        fonts:
          theme.fonts,
      }),
      [
        theme,
      ],
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
      ref={
        navigationRef
      }
      onReady={() => {
        setIsNavigationReady(
          true,
        );
      }}
      theme={
        navTheme
      }
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

            NotFound:
              "*",
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
          if (
            !isLoggedIn
          ) {
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
                  name={
                    String(
                      node.menuID,
                    )
                  }
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
  store,
}: TemplateAppProps<TState>) {
  return (
    <ApplicationConfigProvider
      config={
        config
      }
    >
      <Provider
        store={
          store
        }
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
      width: 230,
    },

    layoutContainer: {
      flex: 1,
      minHeight: 0,
      overflow:
        "hidden",
    },

    loadingScreen: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",
    },
  });