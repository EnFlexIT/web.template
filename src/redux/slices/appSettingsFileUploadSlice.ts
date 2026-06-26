import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { AuthMethod } from "./apiSlice";

type MessageType = "INFO" | "WARNING" | "ERROR";

export type UploadMessage = {
  dateTime?: string;
  messageType?: MessageType;
  message?: string;
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
  performative: string;
  file: {
    uri?: string;
    name: string;
    type?: string;
    file?: any;
  };
};

function normalizeBaseUrl(url: string): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function parseJsonSafely(text: string): any {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRedirectStatus(status: number): boolean {
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
    { baseUrl, jwt, authenticationMethod, performative, file },
    { rejectWithValue },
  ) => {
    const base = normalizeBaseUrl(baseUrl);
    const selectedPerformative = performative.trim();

    if (!base) {
      return rejectWithValue("Server-URL fehlt.");
    }

    if (!selectedPerformative) {
      return rejectWithValue("Konfiguration/Performative fehlt.");
    }

    if (!file?.file && !file?.uri) {
      return rejectWithValue("Datei fehlt.");
    }

    const formData = new FormData();

    if (file.file) {
      formData.append("file", file.file, file.name);
    } else {
      formData.append(
        "file",
        {
          uri: file.uri,
          name: file.name,
          type: file.type || "application/octet-stream",
        } as any,
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Performative": selectedPerformative,
    };

    if (authenticationMethod === "jwt" && jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    try {
      const response = await fetch(`${base}/api/app/settings/upload`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        redirect: "manual",
        headers,
        body: formData,
      });

      if (
        isRedirectStatus(response.status) ||
        (response as any).type === "opaqueredirect"
      ) {
        return rejectWithValue(
          "Session ist abgelaufen oder Login erforderlich.",
        );
      }

      const bodyText = await response.text();
      const data = parseJsonSafely(bodyText);

      if (!response.ok) {
        return rejectWithValue(
          data?.message ||
            data?.messageText ||
            bodyText ||
            `Upload fehlgeschlagen. Status: ${response.status}`,
        );
      }

      if (data?.messageType === "ERROR") {
        return rejectWithValue(
          data?.message || "Upload wurde vom Server abgelehnt.",
        );
      }

      return {
        dateTime: data?.dateTime,
        messageType: data?.messageType,
        message: data?.message || "Upload erfolgreich.",
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
        state.error = null;
        state.result = action.payload;
      })
      .addCase(uploadAppSettingsFile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unbekannter Fehler beim Datei-Upload.";
        state.result = null;
      });
  },
});

export const { resetUploadState } = appSettingsFileUploadSlice.actions;

export default appSettingsFileUploadSlice.reducer;