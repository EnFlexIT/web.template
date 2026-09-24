import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  Platform,
} from "react-native";

import type {
  TemplateRootState,
} from "@/template/state/store/templateReducers";

//**************************************************************************** */

export type LogFilesState = {
  availableDates: string[];
  loading: boolean;
  error: string | null;

  downloadLoading: boolean;
  downloadError: string | null;
};

const initialState: LogFilesState = {
  availableDates: [],
  loading: false,
  error: null,

  downloadLoading: false,
  downloadError: null,
};

//**************************************************************************** */

export const loadLogFiles =
  createAsyncThunk<
    string[],
    void,
    {
      state: TemplateRootState;
      rejectValue: string;
    }
  >(
    "logFiles/load",
    async (
      _,
      thunkAPI,
    ) => {
      try {
        const api =
          thunkAPI
            .getState()
            .api
            .awb_rest_api
            .adminsApi;

        const response =
          await api.getLogFiles();

        const dates =
          Array.isArray(
            response.data,
          )
            ? response.data
            : [];

        return dates
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                "string" &&
              value.trim().length >
                0,
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.localeCompare(
                left,
              ),
          );
      } catch (error: unknown) {
        console.warn(
          "[LOG FILES] Loading log files failed",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "";

        return thunkAPI.rejectWithValue(
          message ||
            "Log-Dateien konnten nicht geladen werden.",
        );
      }
    },
  );

//**************************************************************************** */

type DownloadLogArchiveArgs = {
  from: string;
  to: string;
};

export const downloadLogArchive =
  createAsyncThunk<
    void,
    DownloadLogArchiveArgs,
    {
      state: TemplateRootState;
      rejectValue: string;
    }
  >(
    "logFiles/downloadArchive",
    async (
      {
        from,
        to,
      },
      thunkAPI,
    ) => {
      const normalizedFrom =
        from.trim();

      const normalizedTo =
        to.trim();

      if (
        !normalizedFrom ||
        !normalizedTo
      ) {
        return thunkAPI.rejectWithValue(
          "Von- und Bis-Datum müssen angegeben werden.",
        );
      }

      if (
        normalizedFrom >
        normalizedTo
      ) {
        return thunkAPI.rejectWithValue(
          "Das Von-Datum darf nicht nach dem Bis-Datum liegen.",
        );
      }

      if (
        Platform.OS !== "web"
      ) {
        return thunkAPI.rejectWithValue(
          "Der ZIP-Download ist aktuell nur im Web verfügbar.",
        );
      }

      try {
        const api =
          thunkAPI
            .getState()
            .api
            .awb_rest_api
            .adminsApi;

        const response =
          await api.downloadLogArchive(
            normalizedFrom,
            normalizedTo,
            {
              responseType:
                "blob",
            },
          );

        const responseData =
          response.data;

        const blob =
          responseData instanceof
          Blob
            ? responseData
            : new Blob(
                [
                  responseData as any,
                ],
                {
                  type:
                    "application/zip",
                },
              );

        if (
          blob.size === 0
        ) {
          return thunkAPI.rejectWithValue(
            "Das heruntergeladene ZIP-Archiv ist leer.",
          );
        }

        const contentDisposition =
          response.headers?.[
            "content-disposition"
          ];

        let filename =
          "logs.zip";

        if (
          typeof contentDisposition ===
          "string"
        ) {
          const filenameMatch =
            /filename="?([^"]+)"?/i.exec(
              contentDisposition,
            );

          if (
            filenameMatch?.[1]
          ) {
            filename =
              filenameMatch[1];
          }
        }

        const objectUrl =
          window.URL.createObjectURL(
            blob,
          );

        const link =
          document.createElement(
            "a",
          );

        link.href =
          objectUrl;

        link.download =
          filename;

        link.style.display =
          "none";

        document.body.appendChild(
          link,
        );

        link.click();
        link.remove();

        window.setTimeout(
          () => {
            window.URL.revokeObjectURL(
              objectUrl,
            );
          },
          1000,
        );
      } catch (error: unknown) {
        console.warn(
          "[LOG FILES] Download log archive failed",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "";

        return thunkAPI.rejectWithValue(
          message ||
            "Das Log-Archiv konnte nicht heruntergeladen werden.",
        );
      }
    },
  );

//**************************************************************************** */

const logFilesSlice =
  createSlice({
    name: "logFiles",

    initialState,

    reducers: {
      resetLogFilesState(
        state,
      ) {
        state.availableDates =
          [];

        state.loading =
          false;

        state.error =
          null;

        state.downloadLoading =
          false;

        state.downloadError =
          null;
      },

      clearLogFilesError(
        state,
      ) {
        state.error =
          null;
      },

      clearLogDownloadError(
        state,
      ) {
        state.downloadError =
          null;
      },
    },

    extraReducers: (
      builder,
    ) => {
      builder
        .addCase(
          loadLogFiles.pending,
          (state) => {
            state.loading =
              true;

            state.error =
              null;
          },
        )

        .addCase(
          loadLogFiles.fulfilled,
          (
            state,
            action,
          ) => {
            state.loading =
              false;

            state.error =
              null;

            state.availableDates =
              action.payload;
          },
        )

        .addCase(
          loadLogFiles.rejected,
          (
            state,
            action,
          ) => {
            state.loading =
              false;

            state.error =
              action.payload ??
              action.error
                .message ??
              "Log-Dateien konnten nicht geladen werden.";
          },
        )

        .addCase(
          downloadLogArchive.pending,
          (state) => {
            state.downloadLoading =
              true;

            state.downloadError =
              null;
          },
        )

        .addCase(
          downloadLogArchive.fulfilled,
          (state) => {
            state.downloadLoading =
              false;

            state.downloadError =
              null;
          },
        )

        .addCase(
          downloadLogArchive.rejected,
          (
            state,
            action,
          ) => {
            state.downloadLoading =
              false;

            state.downloadError =
              action.payload ??
              action.error
                .message ??
              "Das Log-Archiv konnte nicht heruntergeladen werden.";
          },
        );
    },
  });

//**************************************************************************** */

export const {
  resetLogFilesState,
  clearLogFilesError,
  clearLogDownloadError,
} = logFilesSlice.actions;

export default logFilesSlice.reducer;

//**************************************************************************** */

export const selectLogFiles =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles;

export const selectAvailableLogDates =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles
      .availableDates;

export const selectLogFilesLoading =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles.loading;

export const selectLogFilesError =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles.error;

export const selectLogArchiveDownloading =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles
      .downloadLoading;

export const selectLogArchiveDownloadError =
  (
    state: TemplateRootState,
  ) =>
    state.logFiles
      .downloadError;