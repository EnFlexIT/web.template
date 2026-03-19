import { RootState } from "../../redux/store";

type PropertyEntry = {
  key: string;
  value: string;
  valueType: "INTEGER" | "BOOLEAN" | "STRING" | "LONG" | "DOUBLE";
};

type PropertiesResponse = {
  performative?: string | null;
  propertyEntries?: PropertyEntry[];
};

export async function loadDbSettingsFromApi(state: RootState) {
  const response = await state.api.awb_rest_api.infoApi.getAppSettings({
    headers: {
      "X-Performative": "GET_DB_SETTINGS",
    },
  } as any);

  return response.data as PropertiesResponse;
}

export async function saveDbSettingsToApi(
  state: RootState,
  propertyEntries: PropertyEntry[],
) {
  return state.api.awb_rest_api.infoApi.setAppSettings({
    performative: "SET_DB_SETTINGS",
    propertyEntries,
  } as any);
}