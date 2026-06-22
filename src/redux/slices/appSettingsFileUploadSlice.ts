// redux/slices/appSettingsFileUploadSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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
  file: {
    uri?: string;
    name: string;
    type?: string;
    file?: File;
  };
  performative: string;
};

export const uploadAppSettingsFile = createAsyncThunk<
  UploadMessage,
  UploadArgs,
  { rejectValue: string }
>(
  "appSettingsFileUpload/upload",
  async ({ baseUrl, jwt, file, performative }, { rejectWithValue }) => {
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

    try {
      const response = await fetch(`${baseUrl}/api/app/settings/file/upload`, {
        method: "POST",
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          xPerformative: performative,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data?.message || "Upload fehlgeschlagen.");
      }

      if (data?.messageType === "ERROR") {
        return rejectWithValue(data?.message || "Upload wurde vom Server abgelehnt.");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Upload konnte nicht ausgeführt werden.");
    }
  },
);

const appSettingsFileUploadSlice = createSlice({
  name: "appSettingsFileUpload",
  initialState,
  reducers: {
    resetUploadState: state => {
      state.loading = false;
      state.error = null;
      state.result = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(uploadAppSettingsFile.pending, state => {
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