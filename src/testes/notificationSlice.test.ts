/// <reference types="jest" />

jest.mock("../redux/selectors/serverSelectors", () => ({
  normalizeServerKey: (value: string) =>
    String(value ?? "").trim().toLowerCase().replace(/\/+$/, ""),
  selectActiveServerKey: (state: any) => state.server?.activeServerKey ?? "",
}));

import reducer, {
  AppNotification,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  markServerNotificationsRead,
  removeNotification,
  clearNotifications,
  clearServerNotifications,
  openNotificationPopup,
  closeNotificationPopup,
  toggleNotificationPopup,
  selectAllNotifications,
  selectUnreadNotifications,
  selectUnreadNotificationCount,
  selectLatestNotifications,
  selectNotificationPopupOpen,
} from "../redux/slices/notificationSlice";

const createNotification = (
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: "notification-1",
  serverKey: "http://localhost:8080",
  type: "system",
  title: "Test Notification",
  message: "Test Message",
  createdAt: "2026-05-12T10:00:00.000Z",
  read: false,
  severity: "info",
  ...overrides,
});

describe("notificationSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.items).toEqual([]);
    expect(state.popupOpen).toBe(false);
  });

  it("should add notification", () => {
    const notification = createNotification();

    const state = reducer(undefined, addNotification(notification));

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(notification);
  });

  it("should not add duplicate notification", () => {
    const notification = createNotification();

    let state = reducer(undefined, addNotification(notification));
    state = reducer(state, addNotification(notification));

    expect(state.items).toHaveLength(1);
  });

  it("should sort notifications newest first", () => {
    const older = createNotification({
      id: "old",
      createdAt: "2026-05-12T09:00:00.000Z",
    });

    const newer = createNotification({
      id: "new",
      createdAt: "2026-05-12T11:00:00.000Z",
    });

    let state = reducer(undefined, addNotification(older));
    state = reducer(state, addNotification(newer));

    expect(state.items[0].id).toBe("new");
    expect(state.items[1].id).toBe("old");
  });

  it("should mark notification read", () => {
    const notification = createNotification();

    let state = reducer(undefined, addNotification(notification));
    state = reducer(state, markNotificationRead(notification.id));

    expect(state.items[0].read).toBe(true);
  });

  it("should ignore mark read for unknown notification", () => {
    const notification = createNotification();

    let state = reducer(undefined, addNotification(notification));
    state = reducer(state, markNotificationRead("unknown"));

    expect(state.items[0].read).toBe(false);
  });

  it("should mark all notifications read", () => {
    let state = reducer(
      undefined,
      addNotification(createNotification({ id: "1", read: false })),
    );

    state = reducer(
      state,
      addNotification(createNotification({ id: "2", read: false })),
    );

    state = reducer(state, markAllNotificationsRead());

    expect(state.items.every((item) => item.read)).toBe(true);
  });

  it("should mark server notifications read", () => {
    let state = reducer(
      undefined,
      addNotification(
        createNotification({
          id: "1",
          serverKey: "HTTP://LOCALHOST:8080/",
          read: false,
        }),
      ),
    );

    state = reducer(
      state,
      addNotification(
        createNotification({
          id: "2",
          serverKey: "http://other-server:8080",
          read: false,
        }),
      ),
    );

    state = reducer(state, markServerNotificationsRead("http://localhost:8080"));

    const target = state.items.find((item) => item.id === "1");
    const other = state.items.find((item) => item.id === "2");

    expect(target?.read).toBe(true);
    expect(other?.read).toBe(false);
  });

  it("should remove notification", () => {
    const notification = createNotification();

    let state = reducer(undefined, addNotification(notification));
    state = reducer(state, removeNotification(notification.id));

    expect(state.items).toEqual([]);
  });

  it("should clear all notifications", () => {
    let state = reducer(
      undefined,
      addNotification(createNotification({ id: "1" })),
    );

    state = reducer(
      state,
      addNotification(createNotification({ id: "2" })),
    );

    state = reducer(state, clearNotifications());

    expect(state.items).toEqual([]);
  });

  it("should clear server notifications", () => {
    let state = reducer(
      undefined,
      addNotification(
        createNotification({
          id: "1",
          serverKey: "http://localhost:8080",
        }),
      ),
    );

    state = reducer(
      state,
      addNotification(
        createNotification({
          id: "2",
          serverKey: "http://other-server:8080",
        }),
      ),
    );

    state = reducer(state, clearServerNotifications("http://localhost:8080"));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe("2");
  });

  it("should open notification popup", () => {
    const state = reducer(undefined, openNotificationPopup());

    expect(state.popupOpen).toBe(true);
  });

  it("should close notification popup", () => {
    let state = reducer(undefined, openNotificationPopup());
    state = reducer(state, closeNotificationPopup());

    expect(state.popupOpen).toBe(false);
  });

  it("should toggle notification popup", () => {
    let state = reducer(undefined, toggleNotificationPopup());

    expect(state.popupOpen).toBe(true);

    state = reducer(state, toggleNotificationPopup());

    expect(state.popupOpen).toBe(false);
  });

  it("should select notifications for active server", () => {
    const notificationState = {
      items: [
        createNotification({
          id: "1",
          serverKey: "http://localhost:8080",
        }),
        createNotification({
          id: "2",
          serverKey: "http://other-server:8080",
        }),
      ],
      popupOpen: false,
    };

    const rootState: any = {
      notifications: notificationState,
      server: {
        activeServerKey: "http://localhost:8080",
      },
    };

    expect(selectAllNotifications(rootState)).toHaveLength(1);
    expect(selectAllNotifications(rootState)[0].id).toBe("1");
  });

  it("should select unread notifications for active server", () => {
    const rootState: any = {
      notifications: {
        items: [
          createNotification({
            id: "1",
            serverKey: "http://localhost:8080",
            read: false,
          }),
          createNotification({
            id: "2",
            serverKey: "http://localhost:8080",
            read: true,
          }),
          createNotification({
            id: "3",
            serverKey: "http://other-server:8080",
            read: false,
          }),
        ],
        popupOpen: false,
      },
      server: {
        activeServerKey: "http://localhost:8080",
      },
    };

    expect(selectUnreadNotifications(rootState)).toHaveLength(1);
    expect(selectUnreadNotifications(rootState)[0].id).toBe("1");
    expect(selectUnreadNotificationCount(rootState)).toBe(1);
  });

  it("should select latest unread notifications with limit", () => {
    const rootState: any = {
      notifications: {
        items: [
          createNotification({
            id: "1",
            serverKey: "http://localhost:8080",
            createdAt: "2026-05-12T12:00:00.000Z",
            read: false,
          }),
          createNotification({
            id: "2",
            serverKey: "http://localhost:8080",
            createdAt: "2026-05-12T11:00:00.000Z",
            read: false,
          }),
          createNotification({
            id: "3",
            serverKey: "http://localhost:8080",
            createdAt: "2026-05-12T10:00:00.000Z",
            read: false,
          }),
        ],
        popupOpen: false,
      },
      server: {
        activeServerKey: "http://localhost:8080",
      },
    };

    const latest = selectLatestNotifications(2)(rootState);

    expect(latest).toHaveLength(2);
    expect(latest[0].id).toBe("1");
    expect(latest[1].id).toBe("2");
  });

  it("should select notification popup open state", () => {
    const rootState: any = {
      notifications: {
        items: [],
        popupOpen: true,
      },
    };

    expect(selectNotificationPopupOpen(rootState)).toBe(true);
  });
});

/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/notificationSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux notificationSlice isoliert ohne echte UI
 * und ohne echte Navigation.
 *
 * Fokus:
 * - Notification State
 * - Notification hinzufügen
 * - Duplicate Prevention
 * - Read / Unread Status
 * - Server-spezifische Notifications
 * - Notification Popup State
 * - Notification Selectors
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - doppelte Notifications
 * - falsche Sortierung
 * - fehlerhafte Read/Unread Zustände
 * - falsche Server-Zuordnung
 * - kaputtes Löschen von Notifications
 * - falsche Notification Counts
 * - fehlerhafte Popup States
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Add Notification Tests
 * 3. Duplicate Prevention Tests
 * 4. Sorting Tests
 * 5. Read / Unread Tests
 * 6. Server Filtering Tests
 * 7. Remove / Clear Tests
 * 8. Popup State Tests
 * 9. Selector Tests
 *
 * ============================================================
 * UI FEATURES COVERED
 * ============================================================
 * - Notification Popup
 * - Notification Badge Count
 * - Latest Notifications
 * - Server-specific Notifications
 *
 * ============================================================
 * MOCKED DEPENDENCIES
 * ============================================================
 * - serverSelectors.normalizeServerKey
 * - serverSelectors.selectActiveServerKey
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der Notification-Logik,
 * damit Benachrichtigungen, Badge-Zähler und
 * Server-spezifische Hinweise stabil funktionieren.
 * ============================================================
 */