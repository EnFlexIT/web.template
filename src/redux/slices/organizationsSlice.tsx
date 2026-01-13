import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Data } from "./Data";

/** Type defintion for what an Organization is */
interface Organization {
  cookie_preference: string;
  last_jwt: string;
  ip_adress: string;
  last_successful_connection: string;
}

/** Type Definition for Redux state */
export interface OrganizationsState {
  organizations: Record<string, Organization>;
  current_organization?: string;
}

/** Async Storage key to store OrganizationsState */
const key = "organizations" as const;

/** Initial State thats provided to redux */
const initialState: OrganizationsState = {
  organizations: {},
};

/** Thunk to initialize redux state */
const initializeState = createAsyncThunk(
  "organizations/initialize",
  async function () {
    const storedVal = await readData();
    if (storedVal) {
      const val = parseData(storedVal);
      if (val) {
        return val;
      } else {
        return initialState;
      }
    } else {
      return initialState;
    }
  },
);

function parseData(data: string): OrganizationsState | null {
  try {
    /** We typically would also check if the parsed object actually has all fields that are required by a OrganizationsState object */
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

async function readData(): Promise<string | null> {
  return await AsyncStorage.getItem(key);
}

function writeData(data: string): void {
  AsyncStorage.setItem(key, data);
}

function stringifyData(data: OrganizationsState): string {
  return JSON.stringify(data);
}

const slice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    addOrganization: (
      state,
      action: PayloadAction<{ name: string; organization: Organization }>,
    ) => {
      state.organizations[action.payload.name] = action.payload.organization;
      AsyncStorage.setItem(key, JSON.stringify(state));
    },
    setCurrentOrganization: (
      state,
      action: PayloadAction<{ name: string }>,
    ) => {
      state.current_organization = action.payload.name;
      AsyncStorage.setItem(key, JSON.stringify(state));
    },
  },
  extraReducers(builder) {
    builder.addCase(initializeState.fulfilled, (state, { payload }) => {
      /* As always, immer just does not work with simple assignment, we instead copy inner elements */
      state.organizations = payload.organizations;
      state.current_organization = payload.current_organization;
      AsyncStorage.setItem(key, JSON.stringify(payload));
    });
  },
});

export const OrganizationsData = {
  slice: slice,

  initializeState: initializeState,

  parseData: parseData,

  readData: readData,

  writeData: writeData,

  stringifyData: stringifyData,

  initialState: initialState,

  id: "organizations",

  dependencies: [],
} satisfies Data<OrganizationsState>;

export const selectOrganizations = (state: RootState) => state.organizations;

export const { addOrganization, setCurrentOrganization } =
  OrganizationsData.slice.actions;
export { initializeState as initializeOrganizations };
