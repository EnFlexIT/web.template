// redux/slices/appSettingsFileUploadSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthMethod } from "./apiSlice";

type MessageType = "INFO" | "WARNING" | "ERROR";

type UploadMessage = {
  dateTime?: string;
  message?: string;
  messageType?: MessageType;
};

type UploadState = {
  loading: boolean;
  error: string | null;
  result: UploadMessage | null;
};

const initialState: UploadState = {
  loading: false,
  error: null,
  result: null,
};

type UploadArgs = {
  baseUrl: string;
  jwt?: string | null;
  authenticationMethod: AuthMethod;
  file: {
    uri?: string;
    name: string;
    type?: string;
    file?: File;
  };
  performative: string;
};

function isRedirectStatus(status?: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

export const uploadAppSettingsFile = createAsyncThunk<
  UploadMessage,
  UploadArgs,
  { rejectValue: string }
>(
  "appSettingsFileUpload/upload",
  async (
    { baseUrl, jwt, authenticationMethod, file, performative },
    { rejectWithValue },
  ) => {
    if (!performative?.trim()) {
      return rejectWithValue("Performative fehlt.");
    }

    const formData = new FormData();

    if (file.file) {
      formData.append("file", file.file, file.name);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type || "application/octet-stream",
      } as any);
    }

    const headers: Record<string, string> = {
      xPerformative: performative,
    };

    if (authenticationMethod === "jwt" && jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    try {
      const response = await fetch(`${baseUrl}/api/app/settings/file/upload`, {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers,
        body: formData,
      });

      if (isRedirectStatus(response.status) || response.type === "opaqueredirect") {
        return rejectWithValue("OIDC-Session ist nicht authentifiziert.");
      }

      let data: UploadMessage | null = null;

      try {
        data = (await response.json()) as UploadMessage;
      } catch {
        data = null;
      }

      if (!response.ok) {
        return rejectWithValue(data?.message || "Upload fehlgeschlagen.");
      }

      if (data?.messageType === "ERROR") {
        return rejectWithValue(
          data?.message || "Upload wurde vom Server abgelehnt.",
        );
      }

      return data ?? {
        messageType: "INFO",
        message: "Upload erfolgreich.",
      };
    } catch (error: any) {
      return rejectWithValue(
        error?.message || "Upload konnte nicht ausgeführt werden.",
      );
    }
  },
);

const appSettingsFileUploadSlice = createSlice({
  name: "appSettingsFileUpload",
  initialState,
  reducers: {
    resetUploadState: (state) => {
      state.loading = false;
      state.error = null;
      state.result = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAppSettingsFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
      })
      .addCase(uploadAppSettingsFile.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(uploadAppSettingsFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unbekannter Upload-Fehler.";
      });
  },
});

export const { resetUploadState } = appSettingsFileUploadSlice.actions;

export default appSettingsFileUploadSlice.reducer;