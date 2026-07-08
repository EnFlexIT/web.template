import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { normalizeBaseUrl, type AuthMethod } from "./apiSlice";

type PropertyEntry = {
  key: string;
  value: string | boolean | number | null;
  valueType?: string;
};

type PropertiesResponse = {
  performative: string | null;
  propertyEntries: PropertyEntry[];
};

export type UserProfile = {
  fullName: string | null;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
};

type UserProfileState = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};

const getValue = (
  entries: PropertyEntry[],
  key: string,
): string | null => {
  const value = entries.find((entry) => entry.key === key)?.value;
  return value == null ? null : String(value);
};

const mapUserProfile = (entries: PropertyEntry[]): UserProfile => ({
  fullName: getValue(entries, "_oidc.name"),
  email: getValue(entries, "_oidc.email"),
  givenName: getValue(entries, "_oidc.given_name"),
  familyName: getValue(entries, "_oidc.family_name"),
});

export const loadUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { state: RootState; rejectValue: string }
>("userProfile/loadUserProfile", async (_, thunkAPI) => {
  const state = thunkAPI.getState();

  const baseUrl = normalizeBaseUrl(state.api.ip);
  const jwt = state.api.jwt;
  const authenticationMethod = state.api.authenticationMethod as AuthMethod;

  if (!baseUrl) {
    return thunkAPI.rejectWithValue("Keine Server-URL vorhanden.");
  }

  const response = await fetch(`${baseUrl}/api/app/settings/get`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(authenticationMethod === "jwt" && jwt
        ? { Authorization: `Bearer ${jwt}` }
        : {}),
    },
  });

  if (!response.ok) {
    return thunkAPI.rejectWithValue(
      `User Profile konnte nicht geladen werden: ${response.status}`,
    );
  }

  const data = (await response.json()) as PropertiesResponse;
  const entries = Array.isArray(data.propertyEntries)
    ? data.propertyEntries
    : [];

  return mapUserProfile(entries);
});

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(loadUserProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });

    builder.addCase(loadUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.profile = null;
      state.error =
        action.payload ?? "User Profile konnte nicht geladen werden.";
    });
  },
});

export const { clearUserProfile } = userProfileSlice.actions;

export const selectUserProfile = (state: RootState) =>
  state.userProfile.profile;

export const selectIsUserProfileLoading = (state: RootState) =>
  state.userProfile.isLoading;

export const selectUserProfileError = (state: RootState) =>
  state.userProfile.error;

export default userProfileSlice.reducer;