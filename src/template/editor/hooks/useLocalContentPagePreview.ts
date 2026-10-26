import { useEffect, useMemo, useState } from "react";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  createRuntimeMenuSnapshot,
} from "../adapters/createRuntimeMenuSnapshot";

import {
  loadLocalContentPreview,
  type LoadLocalContentPreviewResult,
} from "../adapters/loadLocalContentPreview";

import {
  isLocalContentPreviewEnabled,
} from "../config/localContentPreviewConfig";

import {
  subscribeLocalEditorDraftSaved,
} from "../storage/localEditorDraftEvents";

type ReadyPreview = Extract<
  LoadLocalContentPreviewResult,
  { status: "ready" }
>;

export interface LocalContentPagePreview {
  status: "disabled" | "loading" | "ready" | "empty" | "invalid" | "error";
  roots: ReadyPreview["roots"];
  pages: ReadyPreview["pages"];
}

function emptyPreview(
  status: LocalContentPagePreview["status"],
): LocalContentPagePreview {
  return {
    status,
    roots: [],
    pages: [],
  };
}

/**
 * Reads validated local content for a development-only
 * page preview.
 *
 * Does not publish or modify runtime navigation.
 */
export function useLocalContentPagePreview(): LocalContentPagePreview {
  const {
    id: applicationId,
    navigation,
  } = useApplicationConfig();

  const enabled = isLocalContentPreviewEnabled();

  const snapshot = useMemo(
    () => enabled
      ? createRuntimeMenuSnapshot(applicationId)
      : null,
    [applicationId, enabled],
  );

  const allowedContentParentIds =
    navigation.editor?.allowedContentParentIds;

  const allowedContentParentIdsKey =
    JSON.stringify(allowedContentParentIds ?? []);

  const [preview, setPreview] =
    useState<LocalContentPagePreview>(() =>
      emptyPreview(enabled ? "loading" : "disabled"),
    );

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribeLocalEditorDraftSaved(event => {
      if (
        event.applicationId === applicationId &&
        event.scope === "regular"
      ) {
        setRevision(value => value + 1);
      }
    });
  }, [applicationId, enabled]);

  useEffect(() => {
    let active = true;

    if (!enabled || !snapshot) {
      setPreview(emptyPreview("disabled"));
      return () => {
        active = false;
      };
    }

    const initialDraft = {
      schemaVersion: 1 as const,
      applicationId,
      entries: snapshot.entries.map(entry => ({ ...entry })),
      pages: [],
    };

    void loadLocalContentPreview(
      initialDraft,
      snapshot.protectedEntries,
      {
        allowedContentParentIds:
          allowedContentParentIds ?? [],
      },
      snapshot.inventory,
    ).then(result => {
      if (!active) {
        return;
      }

      if (result.status === "ready") {
        setPreview({
          status: "ready",
          roots: result.roots,
          pages: result.pages,
        });
      } else {
        setPreview(emptyPreview(result.status));
      }
    }).catch(() => {
      if (active) {
        setPreview(emptyPreview("error"));
      }
    });

    return () => {
      active = false;
    };
  }, [
    applicationId,
    enabled,
    snapshot,
    allowedContentParentIdsKey,
    revision,
  ]);

  return enabled ? preview : emptyPreview("disabled");
}