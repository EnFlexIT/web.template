import type {
  CreateContentRequest,
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectBackendContentWriteContext,
} from "./updateBackendContentElementFromStore";

import {
  prepareBackendTextCreationV2,
} from "./prepareBackendTextCreationV2";

import {
  sanitizeContentHtml,
} from "../utils/sanitizeContentHtml";

export interface CreateBackendTextParamsV2 {
  menuId: number;
  position: number;
  html: string;
  getState: () => TemplateRootState;
}

export async function createBackendTextFromStoreV2({
  menuId,
  position,
  html,
  getState,
}: CreateBackendTextParamsV2): Promise<number> {

  const draft = prepareBackendTextCreationV2({
    menuId,
    position,
    html: sanitizeContentHtml(html),
  });

  if (!draft.html.replace(/<[^>]*>/g, "").trim()) {
    throw new Error("Textinhalt darf nicht leer sein.");
  }

  const initial = selectBackendContentWriteContext(getState());

  // Vollständigen, bereits konfigurierten V2-API-Client verwenden.
  const client = getState().api.dynamic_content_api_v2.defaultApi;

  const isCurrentAndWritable = () => {
    const current = selectBackendContentWriteContext(getState());

    return (
      current.isLoggedIn &&
      current.canEdit &&
      !current.isSwitchingServer &&
      !current.isLoggingOut &&
      !!current.server?.trim() &&
      current.server === initial.server &&
      current.authGeneration === initial.authGeneration &&
      getState().api.dynamic_content_api_v2.defaultApi === client
    );
  };

  if (!isCurrentAndWritable()) {
    throw new Error("Keine bestätigte Backend-Schreibberechtigung.");
  }

  // Bei GenerationType.IDENTITY erzeugt die Datenbank die neue ID.
  // Deshalb wird uniqueContentId beim Erstellen nicht gesetzt.
  const content = {
    abstractSiteContentType: "SiteContentText",
    editable: true,
    updatePeriodInSeconds: 0,
    mimeType: "text/html",
    text: draft.html,
  } as SiteContentText;

  const request: CreateContentRequest = {
    menuId: draft.menuId,
    position: draft.position,
    content,
  };

  if (!isCurrentAndWritable()) {
    throw new Error("Backend-Sitzung wurde geändert.");
  }

  // Ein POST kann auch bei Verbindungsfehler bereits gespeichert sein.
  // Deshalb darf bei unklarem Ergebnis nicht automatisch wiederholt werden.
  const response = await client.createContentElement(request);

  if (!isCurrentAndWritable()) {
    throw new Error(
      "Sitzung nach POST geändert. Serverstand manuell prüfen.",
    );
  }

  const id = response.data?.elementId;

  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error(
      "Server hat keine gültige Element-ID zurückgegeben.",
    );
  }

  const verified = await client.getContentElement(id);

  if (!isCurrentAndWritable()) {
    throw new Error(
      "Sitzung beim Nachladen geändert. Serverstand prüfen.",
    );
  }

  const saved = verified.data as SiteContentText;

  if (
    saved?.abstractSiteContentType !== "SiteContentText" ||
    saved.uniqueContentId !== id ||
    saved.text !== draft.html ||
    saved.mimeType?.split(";")[0]?.trim().toLowerCase() !== "text/html"
  ) {
    throw new Error(
      `Inhalt #${id} konnte nicht eindeutig verifiziert werden.`,
    );
  }

  return id;
}