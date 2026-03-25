import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import {
  normalizeServerKey,
  selectActiveServerKey,
} from "../selectors/serverSelectors";

export type NotificationType = "update" | "password" | "system";

export type NotificationSeverity = "info" | "warning" | "danger" | "success";

export type NotificationAction = {
  type: "navigate";
  menuId: number;
};

export type AppNotification = {
  id: string;
  serverKey: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  severity: NotificationSeverity;
  action?: NotificationAction;
};

type NotificationState = {
  items: AppNotification[];
  popupOpen: boolean;
};

const initialState: NotificationState = {
  items: [],
  popupOpen: false,
};

function sortNewestFirst(items: AppNotification[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      const exists = state.items.some((item) => item.id === action.payload.id);
      if (exists) return;

      state.items = sortNewestFirst([action.payload, ...state.items]);
    },

    markNotificationRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (!item) return;
      item.read = true;
    },

    markAllNotificationsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },

    markServerNotificationsRead: (state, action: PayloadAction<string>) => {
      const serverKey = normalizeServerKey(action.payload);

      state.items.forEach((item) => {
        if (item.serverKey === serverKey) {
          item.read = true;
        }
      });
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    clearNotifications: (state) => {
      state.items = [];
    },

    clearServerNotifications: (state, action: PayloadAction<string>) => {
      const serverKey = normalizeServerKey(action.payload);
      state.items = state.items.filter((item) => item.serverKey !== serverKey);
    },

    openNotificationPopup: (state) => {
      state.popupOpen = true;
    },

    closeNotificationPopup: (state) => {
      state.popupOpen = false;
    },

    toggleNotificationPopup: (state) => {
      state.popupOpen = !state.popupOpen;
    },
  },
});

export const {
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
} = notificationSlice.actions;

export const selectNotificationsState = (state: RootState) =>
  state.notifications;

export const selectAllNotifications = (state: RootState) => {
  const activeServerKey = selectActiveServerKey(state);

  return state.notifications.items.filter(
    (item) => item.serverKey === activeServerKey,
  );
};

export const selectUnreadNotifications = (state: RootState) => {
  const activeServerKey = selectActiveServerKey(state);

  return state.notifications.items.filter(
    (item) => item.serverKey === activeServerKey && !item.read,
  );
};

export const selectUnreadNotificationCount = (state: RootState) => {
  const activeServerKey = selectActiveServerKey(state);

  return state.notifications.items.filter(
    (item) => item.serverKey === activeServerKey && !item.read,
  ).length;
};

export const selectLatestNotifications =
  (limit = 5) =>
  (state: RootState) => {
    const activeServerKey = selectActiveServerKey(state);

    return state.notifications.items
      .filter((item) => item.serverKey === activeServerKey)
      .slice(0, limit);
  };

export const selectNotificationPopupOpen = (state: RootState) =>
  state.notifications.popupOpen;

export default notificationSlice.reducer;