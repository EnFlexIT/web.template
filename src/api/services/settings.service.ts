// src/api/services/settings.service.ts
import { apiConfig } from "../apiConfig";
import { DatabaseConnectionSettings } from "../config/DatabaseConnectionSettings";
import { InfoApi } from "../implementation/AWB-RestAPI";


const api = new InfoApi(apiConfig);


export async function loadDbSettings() {
  const res = await api.getAppSettings({
    headers: { "X-Performative": "GET_DB_SETTINGS" },
  });

  return DatabaseConnectionSettings.fromPropertyEntries(
    res.data.propertyEntries
  );
}

export async function saveDbSettings(settings: DatabaseConnectionSettings) {
  const body = {
    performative: "SET_DB_SETTINGS",
    propertyEntries: settings.toPropertyEntries(),
  };

  return api.setAppSettings(body as any);
}

