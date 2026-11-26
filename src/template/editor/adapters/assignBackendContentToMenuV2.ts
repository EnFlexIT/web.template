import type {
  AssignContentToMenuRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import type {
  BackendContentWriteContext,
} from "./updateBackendContentElement";

import {
  selectBackendContentWriteContext,
} from "./updateBackendContentElementFromStore";

export interface BackendContentAssignmentClient {
  assignContentToMenu(
    menuId: number,
    elementId: number,
    request: AssignContentToMenuRequest,
  ): Promise<unknown>;
}

export interface BackendContentAssignmentContext
  extends Omit<BackendContentWriteContext, "client"> {
  client: BackendContentAssignmentClient;
}

export interface AssignBackendContentParams {
  menuId: number;
  elementId: number;
  position: number;
  getContext: () => BackendContentAssignmentContext;
}

function isWritable(
  context: BackendContentAssignmentContext,
): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    typeof context.server === "string" &&
    context.server.trim().length > 0 &&
    Number.isSafeInteger(context.authGeneration) &&
    context.authGeneration >= 0
  );
}

/**
 * Assigns an existing content element to a menu.
 *
 * Does not create a new content element.
 * Does not remove any existing assignments.
 * Does not retry uncertain backend writes.
 *
 * The caller must verify the target inventory and
 * position before enabling this operation in the UI.
 */
export async function assignBackendContentToMenuV2({
  menuId,
  elementId,
  position,
  getContext,
}: AssignBackendContentParams): Promise<void> {
  if (
    !Number.isSafeInteger(menuId) ||
    menuId <= 0 ||
    !Number.isSafeInteger(elementId) ||
    elementId <= 0
  ) {
    throw new Error("Invalid backend menu or content ID");
  }

  if (
    !Number.isSafeInteger(position) ||
    position <= 0
  ) {
    throw new Error("Target position must be one-based");
  }

  const before = { ...getContext() };

  if (!isWritable(before)) {
    throw new Error(
      "Backend content assignment is not authorized",
    );
  }

  if (
    !before.client ||
    typeof before.client.assignContentToMenu !== "function"
  ) {
    throw new Error(
      "Backend content assignment API is unavailable",
    );
  }

  await before.client.assignContentToMenu(
    menuId,
    elementId,
    { position },
  );

  const after = getContext();

  if (
    !isWritable(after) ||
    before.client !== after.client ||
    before.server !== after.server ||
    before.authGeneration !== after.authGeneration
  ) {
    throw new Error(
      "Backend content assignment completed in a stale session; reload required",
    );
  }
}

export interface AssignBackendContentFromStoreParams {
  menuId: number;
  elementId: number;
  position: number;
  getState: () => TemplateRootState;
}

export function assignBackendContentToMenuFromStoreV2({
  menuId,
  elementId,
  position,
  getState,
}: AssignBackendContentFromStoreParams): Promise<void> {
  return assignBackendContentToMenuV2({
    menuId,
    elementId,
    position,
    getContext: () => {
      const state = getState();

      return {
        ...selectBackendContentWriteContext(state),
        client: state.api.dynamic_content_api_v2.defaultApi,
      };
    },
  });
}
