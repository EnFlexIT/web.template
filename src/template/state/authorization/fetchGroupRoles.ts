import { createAsyncThunk } from "@reduxjs/toolkit";
import type { TemplateRootState } from "@/template/state/store/templateStoreTypes";
import {
  groupRolesRequested,
  groupRolesReceived,
  groupRolesFailed,
} from "./groupRolesSlice";

let nextRequestId = 0;

export const fetchGroupRoles = createAsyncThunk(
  "groupRoles/fetch",
  async (_, thunkAPI) => {
    const initial = thunkAPI.getState() as TemplateRootState;

    if (
      !initial.api.isLoggedIn ||
      !initial.api.isPointingToServer ||
      initial.api.isSwitchingServer ||
      initial.api.isLoggingOut
    ) {
      return;
    }

    const requestId = String(++nextRequestId);
    const apiClient = initial.api.awb_rest_api.userApi;

    thunkAPI.dispatch(groupRolesRequested(requestId));

    const isCurrentRequest = () => {
      const current = thunkAPI.getState() as TemplateRootState;

      return (
        current.api.isLoggedIn === true &&
        current.api.isPointingToServer === true &&
        !current.api.isSwitchingServer &&
        !current.api.isLoggingOut &&
        current.api.ip === initial.api.ip &&
        current.api.jwt === initial.api.jwt &&
        current.api.authenticationMethod ===
          initial.api.authenticationMethod &&
        current.api.awb_rest_api.userApi === apiClient &&
        current.groupRoles.status === "loading" &&
        current.groupRoles.requestId === requestId
      );
    };

    try {
      const response = await apiClient.getGroupRoles();

      if (!isCurrentRequest()) return;

      if (
        !Array.isArray(response.data) ||
        !response.data.every(
          (role: unknown) =>
            typeof role === "string" &&
            role.trim().length > 0
        )
      ) {
        throw new Error("Invalid group roles response");
      }

      thunkAPI.dispatch(
        groupRolesReceived({
          requestId,
          roles: response.data,
        })
      );
    } catch (error) {
      if (!isCurrentRequest()) return;

      thunkAPI.dispatch(
        groupRolesFailed({
          requestId,
          error:
            error instanceof Error
              ? error.message
              : "Group roles request failed",
        })
      );
    }
  }
);
