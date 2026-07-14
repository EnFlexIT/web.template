import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { AppDispatch, RootState } from "../store";
import { normalizeBaseUrl, type AuthMethod } from "./apiSlice";

const LIVE_CONSOLE_PERFORMATIVE =
  process.env.EXPO_PUBLIC_LIVE_CONSOLE_PERFORMATIVE ??
  "REPLACE_WITH_BACKEND_PERFORMATIVE";

const MAX_LOG_LINES = 3000;
const FLUSH_INTERVAL_MS = 75;

export type LiveConsoleStatus =
  | "idle"
  | "requesting-ticket"
  | "connecting"
  | "connected"
  | "closing"
  | "closed"
  | "error";

export type LiveConsoleLine = {
  id: number;
  text: string;
  receivedAt: number;
};

type PendingLine = Omit<LiveConsoleLine, "id">;

export type LiveConsoleState = {
  status: LiveConsoleStatus;
  lines: LiveConsoleLine[];
  followOutput: boolean;
  error: string | null;
  closeCode: number | null;
  closeReason: string | null;
  connectedAt: number | null;
  disconnectedAt: number | null;
};

const initialState: LiveConsoleState = {
  status: "idle",
  lines: [],
  followOutput: true,
  error: null,
  closeCode: null,
  closeReason: null,
  connectedAt: null,
  disconnectedAt: null,
};

/**
 * Das WebSocket-Objekt wird bewusst nicht im Redux-State gespeichert.
 * WebSocket ist kein serialisierbares Redux-Objekt.
 */
let activeSocket: WebSocket | null = null;
let activeGeneration = 0;
let nextLineId = 1;
let pendingLines: PendingLine[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const liveConsoleSlice = createSlice({
  name: "liveConsole",
  initialState,
  reducers: {
    connectionRequested(state) {
      state.status = "requesting-ticket";
      state.lines = [];
      state.error = null;
      state.closeCode = null;
      state.closeReason = null;
      state.connectedAt = null;
      state.disconnectedAt = null;
    },

    socketConnecting(state) {
      state.status = "connecting";
      state.error = null;
    },

    socketOpened(state) {
      state.status = "connected";
      state.error = null;
      state.connectedAt = Date.now();
      state.disconnectedAt = null;
    },

    disconnectRequested(state) {
      state.status = "closing";
    },

    socketClosed(
      state,
      action: PayloadAction<{
        code: number | null;
        reason: string | null;
        manual: boolean;
      }>,
    ) {
      const wasUnexpected =
        !action.payload.manual && action.payload.code !== 1000;

      state.status = wasUnexpected ? "error" : "closed";
      state.closeCode = action.payload.code;
      state.closeReason = action.payload.reason;
      state.disconnectedAt = Date.now();

      if (wasUnexpected) {
        state.error =
          action.payload.reason ||
          (action.payload.code
            ? `WebSocket wurde mit Code ${action.payload.code} geschlossen.`
            : "WebSocket-Verbindung wurde unerwartet geschlossen.");
      }
    },

    socketFailed(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
      state.disconnectedAt = Date.now();
    },

    linesReceived(state, action: PayloadAction<PendingLine[]>) {
      if (action.payload.length === 0) return;

      const startId = nextLineId;
      nextLineId += action.payload.length;

      const nextLines: LiveConsoleLine[] = action.payload.map(
        (line, index) => ({
          ...line,
          id: startId + index,
        }),
      );

      state.lines.push(...nextLines);

      if (state.lines.length > MAX_LOG_LINES) {
        state.lines.splice(0, state.lines.length - MAX_LOG_LINES);
      }
    },

    clearLines(state) {
      state.lines = [];
    },

    setFollowOutput(state, action: PayloadAction<boolean>) {
      state.followOutput = action.payload;
    },

    resetLiveConsoleState() {
      return {
        ...initialState,
        lines: [],
      };
    },
  },
});

export const {
  connectionRequested,
  socketConnecting,
  socketOpened,
  disconnectRequested,
  socketClosed,
  socketFailed,
  linesReceived,
  clearLines,
  setFollowOutput,
  resetLiveConsoleState,
} = liveConsoleSlice.actions;

export default liveConsoleSlice.reducer;

function clearPendingFlush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  pendingLines = [];
}

function flushPendingLines(dispatch: AppDispatch): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (pendingLines.length === 0) return;

  const batch = pendingLines;
  pendingLines = [];

  dispatch(linesReceived(batch));
}

function queueLines(dispatch: AppDispatch, text: string): void {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const rawLines = normalized.split("\n");

  if (rawLines.length > 1 && rawLines[rawLines.length - 1] === "") {
    rawLines.pop();
  }

  const receivedAt = Date.now();

  pendingLines.push(
    ...rawLines.map((line) => ({
      text: line,
      receivedAt,
    })),
  );

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushPendingLines(dispatch);
    }, FLUSH_INTERVAL_MS);
  }
}

async function websocketDataToText(data: unknown): Promise<string> {
  if (typeof data === "string") {
    return data;
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return data.text();
  }

  if (
    data instanceof ArrayBuffer &&
    typeof TextDecoder !== "undefined"
  ) {
    return new TextDecoder().decode(data);
  }

  return String(data ?? "");
}

function extractTicketId(payload: unknown): string | null {
  if (typeof payload === "string") {
    const value = payload.trim();
    return value || null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;

  const directCandidates = [
    data.ticketId,
    data.ticket,
    data["ticket.id"],
  ];

  for (const candidate of directCandidates) {
    const value = String(candidate ?? "").trim();

    if (value) {
      return value;
    }
  }

  const propertyEntries = Array.isArray(data.propertyEntries)
    ? data.propertyEntries
    : [];

  const ticketEntry = propertyEntries.find((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const key = String(
      (entry as Record<string, unknown>).key ?? "",
    )
      .trim()
      .toLowerCase();

    return (
      key === "ticket.id" ||
      key === "ticketid" ||
      key === "ticket"
    );
  });

  if (!ticketEntry || typeof ticketEntry !== "object") {
    return null;
  }

  const value = String(
    (ticketEntry as Record<string, unknown>).value ?? "",
  ).trim();

  return value || null;
}

function isRedirectResponse(response: Response): boolean {
  return (
    response.status === 301 ||
    response.status === 302 ||
    response.status === 303 ||
    response.status === 307 ||
    response.status === 308 ||
    response.type === "opaqueredirect"
  );
}

/**
 * Fordert automatisch eine Ticket-ID beim Backend an.
 *
 * Die Ticket-ID wird nur als Rückgabewert verwendet.
 * Sie wird nicht im Redux-State gespeichert.
 */
async function requestTicket(params: {
  baseUrl: string;
  performative: string;
  authenticationMethod: AuthMethod;
  jwt: string | null;
}): Promise<string> {
  const baseUrl = normalizeBaseUrl(params.baseUrl);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Performative": params.performative,
  };

  if (
    params.authenticationMethod === "jwt" &&
    params.jwt
  ) {
    headers.Authorization = `Bearer ${params.jwt}`;
  }

  const response = await fetch(
    `${baseUrl}/api/app/settings/get`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      redirect: "manual",
      headers,
    },
  );

  if (isRedirectResponse(response)) {
    throw new Error(
      "Die Sitzung ist abgelaufen oder eine Anmeldung ist erforderlich.",
    );
  }

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      bodyText ||
        `Ticket-Anfrage fehlgeschlagen: HTTP ${response.status}`,
    );
  }

  let payload: unknown;

  try {
    payload = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    payload = bodyText;
  }

  const ticketId = extractTicketId(payload);

  if (!ticketId) {
    throw new Error(
      'Die Serverantwort enthält keinen Property-Eintrag mit dem Key "ticket.id".',
    );
  }

  return ticketId;
}

/**
 * Beispiel:
 *
 * http://localhost:8080
 *
 * wird zu:
 *
 * ws://localhost:8080/ws/logs?ticket=123
 *
 * Bei HTTPS wird automatisch WSS verwendet.
 */
function buildLiveConsoleWebSocketUrl(
  baseUrl: string,
  ticketId: string,
): string {
  const url = new URL(normalizeBaseUrl(baseUrl));

  url.protocol =
    url.protocol === "https:" ? "wss:" : "ws:";

  url.pathname = "/ws/logs";
  url.search = "";
  url.hash = "";

  url.searchParams.set("ticket", ticketId);

  return url.toString();
}

function closeCurrentSocket(): void {
  const socket = activeSocket;
  activeSocket = null;

  if (!socket) {
    return;
  }

  try {
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, "Client switched connection");
    }
  } catch {
    // Eine alte Verbindung darf den neuen Aufbau nicht blockieren.
  }
}

/**
 * Wird ohne Parameter aufgerufen.
 *
 * Performative, Ticket-ID und WebSocket-URL bleiben komplett intern.
 */
export const connectLiveConsole =
  () =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
  ): Promise<void> => {
    const performative =
      LIVE_CONSOLE_PERFORMATIVE.trim();

    if (
      !performative ||
      performative === "REPLACE_WITH_BACKEND_PERFORMATIVE"
    ) {
      dispatch(
        socketFailed(
          "Der Live-Console-Performative ist noch nicht konfiguriert.",
        ),
      );

      return;
    }

    const generation = ++activeGeneration;

    closeCurrentSocket();
    clearPendingFlush();

    nextLineId = 1;

    dispatch(connectionRequested());

    try {
      const state = getState();

      const {
        ip,
        jwt,
        authenticationMethod,
      } = state.api;

      if (!ip) {
        throw new Error(
          "Es ist kein Server ausgewählt.",
        );
      }

      /**
       * Ticket wird automatisch angefordert.
       * Es existiert nur in dieser lokalen Variable.
       */
      const ticketId = await requestTicket({
        baseUrl: ip,
        performative,
        authenticationMethod,
        jwt,
      });

      if (generation !== activeGeneration) {
        return;
      }

      /**
       * WebSocket-URL wird ebenfalls nur lokal erzeugt.
       */
      const socketUrl =
        buildLiveConsoleWebSocketUrl(ip, ticketId);

      dispatch(socketConnecting());

      const socket = new WebSocket(socketUrl);

      activeSocket = socket;

      socket.onopen = () => {
        if (
          generation !== activeGeneration ||
          socket !== activeSocket
        ) {
          return;
        }

        dispatch(socketOpened());
      };

      socket.onmessage = (event: MessageEvent) => {
        if (
          generation !== activeGeneration ||
          socket !== activeSocket
        ) {
          return;
        }

        void websocketDataToText(event.data)
          .then((text) => {
            if (
              generation !== activeGeneration ||
              socket !== activeSocket
            ) {
              return;
            }

            queueLines(dispatch, text);
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : "Eine WebSocket-Nachricht konnte nicht gelesen werden.";

            dispatch(socketFailed(message));
          });
      };

      socket.onerror = () => {
        if (
          generation !== activeGeneration ||
          socket !== activeSocket
        ) {
          return;
        }

        dispatch(
          socketFailed(
            "Die WebSocket-Verbindung ist fehlgeschlagen.",
          ),
        );
      };

      socket.onclose = (event: CloseEvent) => {
        if (generation !== activeGeneration) {
          return;
        }

        flushPendingLines(dispatch);

        if (socket === activeSocket) {
          activeSocket = null;
        }

        dispatch(
          socketClosed({
            code:
              typeof event.code === "number"
                ? event.code
                : null,
            reason:
              String(event.reason ?? "").trim() ||
              null,
            manual: event.code === 1000,
          }),
        );
      };
    } catch (error: unknown) {
      if (generation !== activeGeneration) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Die Live-Konsole konnte nicht gestartet werden.";

      dispatch(socketFailed(message));
    }
  };

export const disconnectLiveConsole =
  () =>
  (dispatch: AppDispatch): void => {
    ++activeGeneration;

    dispatch(disconnectRequested());

    flushPendingLines(dispatch);

    const socket = activeSocket;
    activeSocket = null;

    if (socket) {
      try {
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close(1000, "Manuell beendet");
        }
      } catch {
        // Redux-Status wird trotzdem geschlossen.
      }
    }

    dispatch(
      socketClosed({
        code: 1000,
        reason: "Manuell beendet",
        manual: true,
      }),
    );
  };

export const selectLiveConsole = (
  state: RootState,
) => state.liveConsole;

export const selectLiveConsoleLines = (
  state: RootState,
) => state.liveConsole.lines;

export const selectLiveConsoleStatus = (
  state: RootState,
) => state.liveConsole.status;