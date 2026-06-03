export const UPDATE_SETTING_KEYS = {
  AUTO_UPDATE: "isautoupdate",

  FRONTEND_IS_PENDING: "updatecheck.frontend.ispending",
  FRONTEND_IS_AVAILABLE: "updatecheck.frontend.isavailable",
  FRONTEND_LAST_CHECK: "updatecheck.frontend.lastcheck",
  FRONTEND_VERSION: "updatecheck.frontend.version",

  BACKEND_IS_PENDING: "updatecheck.backend.ispending",
  BACKEND_IS_AVAILABLE: "updatecheck.backend.isavailable",
  BACKEND_LAST_CHECK: "updatecheck.backend.lastcheck",

  UPDATE_STATUS: "update.status",
  UPDATE_PROGRESS: "update.progress",
} as const;

export type UpdateSettingKey =
  (typeof UPDATE_SETTING_KEYS)[keyof typeof UPDATE_SETTING_KEYS];