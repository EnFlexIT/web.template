import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectBackendContentWriteContext,
} from "./updateBackendContentElementFromStore";

import type {
  BackendContentWriteContext,
} from "./updateBackendContentElement";

export interface BackendContentRemovalClient {
  removeAssignment(
    menuId: number,
    elementId: number,
  ): Promise<unknown>;
}

export interface BackendContentRemovalContext
  extends Omit<BackendContentWriteContext, "client"> {
  client: BackendContentRemovalClient;
}

export interface RemoveBackendContentAssignmentParams {
  menuId: number;
  elementId: number;
  getContext: () => BackendContentRemovalContext;
}

function isWritable(
  context: BackendContentRemovalContext,
): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    context.server.trim().length > 0 &&
    Number.isSafeInteger(context.authGeneration) &&
    context.authGeneration >= 0
  );
}

export async function removeBackendContentAssignmentV2({
  menuId,
  elementId,
  getContext,
}: RemoveBackendContentAssignmentParams): Promise<void> {
  if (
    !Number.isSafeInteger(menuId) ||
    menuId <= 0 ||
    !Number.isSafeInteger(elementId) ||
    elementId <= 0
  ) {
    throw new Error("Invalid backend menu or content ID");
  }

  const before = getContext();

  if (!isWritable(before)) {
    throw new Error("Backend content removal is not authorized");
  }

  if (
    !before.client ||
    typeof before.client.removeAssignment !== "function"
  ) {
    throw new Error("Backend content removal API is unavailable");
  }

  // No await between authorization and request initiation.
  await before.client.removeAssignment(menuId, elementId);

  const after = getContext();

  if (
    !isWritable(after) ||
    before.client !== after.client ||
    before.server !== after.server ||
    before.authGeneration !== after.authGeneration
  ) {
    // The server may already have removed the assignment.
    // The caller must reload instead of retrying automatically.
    throw new Error(
      "Backend content removal completed in a stale session; reload required",
    );
  }
}

export interface RemoveBackendContentAssignmentFromStoreParams {
  menuId: number;
  elementId: number;
  getState: () => TemplateRootState;
}

export function removeBackendContentAssignmentFromStoreV2({
  menuId,
  elementId,
  getState,
}: RemoveBackendContentAssignmentFromStoreParams): Promise<void> {
  return removeBackendContentAssignmentV2({
    menuId,
    elementId,
    getContext: () => {
      const state = getState();

      return {
        ...selectBackendContentWriteContext(state),
        client: state.api.dynamic_content_api_v2.defaultApi,
      };
    },
  });
}