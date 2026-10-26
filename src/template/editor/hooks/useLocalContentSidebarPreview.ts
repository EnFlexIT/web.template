import { useEffect, useMemo, useState } from "react";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  createRuntimeMenuSnapshot,
} from "../adapters/createRuntimeMenuSnapshot";

import {
  loadLocalContentPreview,
} from "../adapters/loadLocalContentPreview";

import type {
  LocalContentPreviewNode,
} from "../adapters/buildLocalContentPreview";

import {
  isLocalContentPreviewEnabled,
} from "../config/localContentPreviewConfig";

/**
 * Loads validated local content for the development-only
 * sidebar preview without changing production navigation.
 */
export function useLocalContentSidebarPreview():
  readonly LocalContentPreviewNode[] {
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

  // Stable dependency even if config returns a new array.
  const allowedContentParentIdsKey =
    JSON.stringify(allowedContentParentIds ?? []);

  const [roots, setRoots] =
    useState<LocalContentPreviewNode[]>([]);

  useEffect(() => {
    let active = true;

    setRoots([]);

    if (!enabled || !snapshot) {
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
      if (active) {

        setRoots(
          result.status === "ready"
            ? result.roots
            : [],
        );
      }
    }).catch(() => {
      if (active) {

        setRoots([]);
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
  ]);

  return enabled ? roots : [];
}