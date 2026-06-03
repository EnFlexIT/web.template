import { UPDATE_SETTING_KEYS } from "../constants/updateSettingKeys";

export type UpdateSettingValue = string | boolean | number | null;

export interface UpdateSettingsApi {
  getSetting: (key: string) => Promise<UpdateSettingValue>;
}

export async function getFrontendUpdateStatus(api: UpdateSettingsApi) {
  const [isPending, isAvailable, lastCheck, version] = await Promise.all([
    api.getSetting(UPDATE_SETTING_KEYS.FRONTEND_IS_PENDING),
    api.getSetting(UPDATE_SETTING_KEYS.FRONTEND_IS_AVAILABLE),
    api.getSetting(UPDATE_SETTING_KEYS.FRONTEND_LAST_CHECK),
    api.getSetting(UPDATE_SETTING_KEYS.FRONTEND_VERSION),
  ]);

  return {
    isPending: Boolean(isPending),
    isAvailable: Boolean(isAvailable),
    lastCheck: String(lastCheck ?? ""),
    version: String(version ?? ""),
  };
}

export async function getBackendUpdateStatus(api: UpdateSettingsApi) {
  const [isPending, isAvailable, lastCheck, status, progress] =
    await Promise.all([
      api.getSetting(UPDATE_SETTING_KEYS.BACKEND_IS_PENDING),
      api.getSetting(UPDATE_SETTING_KEYS.BACKEND_IS_AVAILABLE),
      api.getSetting(UPDATE_SETTING_KEYS.BACKEND_LAST_CHECK),
      api.getSetting(UPDATE_SETTING_KEYS.UPDATE_STATUS),
      api.getSetting(UPDATE_SETTING_KEYS.UPDATE_PROGRESS),
    ]);

  return {
    isPending: Boolean(isPending),
    isAvailable: Boolean(isAvailable),
    lastCheck: String(lastCheck ?? ""),
    status: String(status ?? ""),
    progress: Number(progress ?? 0),
  };
}

export async function getAutoUpdate(api: UpdateSettingsApi) {
  const autoUpdate = await api.getSetting(UPDATE_SETTING_KEYS.AUTO_UPDATE);
  return Boolean(autoUpdate);
}