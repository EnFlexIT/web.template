import { normalizeBaseUrl } from "./serverCheck";

type ServerEntry = {
  id: string;
  name: string;
  baseUrl: string;
};

type ValidateServerInputParams = {
  servers: ServerEntry[];
  name: string;
  baseUrl: string;
  selectedServerId?: string;
};

export type ServerValidationResult =
  | { ok: true }
  | {
      ok: false;
      field: "name" | "url";
      reason:
        | "urlRequired"
        | "urlInvalid"
        | "nameExists"
        | "urlExists";
    };

export function validateServerInput({
  servers,
  name,
  baseUrl,
  selectedServerId,
}: ValidateServerInputParams): ServerValidationResult {
  if (!baseUrl) {
    return {
      ok: false,
      field: "url",
      reason: "urlRequired",
    };
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    return {
      ok: false,
      field: "url",
      reason: "urlInvalid",
    };
  }

  const nameExists = servers.some((server) => {
    if (server.id === selectedServerId) return false;

    return server.name.toLowerCase() === name.toLowerCase();
  });

  if (nameExists) {
    return {
      ok: false,
      field: "name",
      reason: "nameExists",
    };
  }

  const urlExists = servers.some((server) => {
    if (server.id === selectedServerId) return false;

    return (
      normalizeBaseUrl(server.baseUrl).toLowerCase() ===
      baseUrl.toLowerCase()
    );
  });

  if (urlExists) {
    return {
      ok: false,
      field: "url",
      reason: "urlExists",
    };
  }

  return { ok: true };
}