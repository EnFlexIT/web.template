import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const key = "organizations" as const;

interface Organization {
  cookie_preference: string;
  last_jwt: string;
  ip_adress: string;
  last_successful_connection: string;
}

export interface OrganizationsState {
  organizations: Record<string, Organization>;
  current_organization?: string;
}

const initialState: OrganizationsState = {
  organizations: {},
};

const defaultOrganizations: OrganizationsState = {
  ...initialState,
};

export const initializeOrganizations = createAsyncThunk(
  "organizations/initialize",
  async () => {
    const storedOrganizations = await AsyncStorage.getItem(key);
    if (storedOrganizations) {
      try {
        return (
          (JSON.parse(storedOrganizations) as OrganizationsState) ??
          defaultOrganizations
        );
      } catch (exception) {
        return defaultOrganizations;
      }
    }
    return defaultOrganizations;
  },
);

export const organizationsSlice = createSlice({
  name: "organizations",
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
    builder.addCase(initializeOrganizations.fulfilled, (state, { payload }) => {
      /* As always, immer just does not work with simple assignment, we instead copy inner elements */
      state.organizations = payload.organizations;
      state.current_organization = payload.current_organization;
      AsyncStorage.setItem(key, JSON.stringify(payload));
    });
  },
});

export const selectOrganizations = (state: RootState) => state.organizations;

export const { addOrganization, setCurrentOrganization } =
  organizationsSlice.actions;

export default organizationsSlice.reducer;
