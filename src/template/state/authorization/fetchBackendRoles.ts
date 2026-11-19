import { createAsyncThunk } from "@reduxjs/toolkit";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  backendRolesRequested,
  backendRolesReceived,
  backendRolesFailed,
  backendRolesReset,
} from "./backendRolesSlice";

import {
  normalizeBackendRole,
} from "@/template/authorization/roles";

let nextRequestId = 0;

export const fetchBackendRoles = createAsyncThunk(
  "backendRoles/fetch",
  async (_, thunkAPI) => {
    const initial = thunkAPI.getState() as TemplateRootState;

    if (!initial.api.isLoggedIn) {
      thunkAPI.dispatch(backendRolesReset());
      return;
    }

    const requestId = String(++nextRequestId);
    const apiClient = initial.api.awb_rest_api.userApi;

    const sessionKey = initial.api.ip;

    thunkAPI.dispatch(
      backendRolesRequested({
        requestId,
        sessionKey,
      }),
    );

    try {
      const response = await apiClient.getUserRoles();

      const current = thunkAPI.getState() as TemplateRootState;

      if (
        !current.api.isLoggedIn ||
        current.api.ip !== initial.api.ip ||
        current.api.jwt !== initial.api.jwt ||
        current.api.authenticationMethod !==
          initial.api.authenticationMethod ||
        current.api.awb_rest_api.userApi !== apiClient ||
        current.backendRoles.requestId !== requestId ||
        current.backendRoles.sessionKey !== sessionKey
      ) {
        return;
      }

      if (
        !Array.isArray(response.data) ||
        !response.data.every(
          (role: unknown) => typeof role === "string",
        )
      ) {
        throw new Error("Invalid backend roles response");
      }

      thunkAPI.dispatch(
        backendRolesReceived({
          requestId,
          sessionKey,
          roles: response.data.map(normalizeBackendRole),
        }),
      );
    } catch (error) {
      const current = thunkAPI.getState() as TemplateRootState;

      if (
        !current.api.isLoggedIn ||
        current.api.ip !== initial.api.ip ||
        current.api.jwt !== initial.api.jwt ||
        current.api.authenticationMethod !==
          initial.api.authenticationMethod ||
        current.api.awb_rest_api.userApi !== apiClient ||
        current.backendRoles.requestId !== requestId ||
        current.backendRoles.sessionKey !== sessionKey
      ) {
        return;
      }

      thunkAPI.dispatch(
        backendRolesFailed({
          requestId,
          sessionKey,
          error:
            error instanceof Error
              ? error.message
              : "Backend roles request failed",
        }),
      );
    }
  },
);