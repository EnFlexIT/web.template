import type {
  UpdateContentAssignmentRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectBackendContentWriteContext,
} from "./updateBackendContentElementFromStore";

import type {
  BackendContentWriteContext,
} from "./updateBackendContentElement";

export interface BackendContentMoveClient {
  updateAssignmentAndPosition(
    request: UpdateContentAssignmentRequest,
  ): Promise<unknown>;
}

export interface BackendContentMoveContext
  extends Omit<BackendContentWriteContext, "client"> {
  client: BackendContentMoveClient;
}

export interface MoveBackendContentElementParams {
  request: UpdateContentAssignmentRequest;
  getContext: () => BackendContentMoveContext;
}

function validateRequest(
  request: UpdateContentAssignmentRequest,
): void {
  if (!request) {
    throw new Error("Content move request is required");
  }

  const {
    elementId,
    sourceMenuId,
    targetMenuId,
    position,
  } = request;

  if (
    !Number.isSafeInteger(elementId) ||
    elementId <= 0 ||
    !Number.isSafeInteger(sourceMenuId) ||
    sourceMenuId <= 0 ||
    !Number.isSafeInteger(targetMenuId) ||
    targetMenuId <= 0
  ) {
    throw new Error("Invalid content or menu ID");
  }

  // Dynamic-Content-V2 positions are one-based for this operation.
  if (!Number.isSafeInteger(position) || position < 1) {
    throw new Error("Target position must be one-based");
  }
}

function isWritable(
  context: BackendContentMoveContext,
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

export async function moveBackendContentElementV2({
  request,
  getContext,
}: MoveBackendContentElementParams): Promise<void> {
  validateRequest(request);

  const before = getContext();

  if (!isWritable(before)) {
    throw new Error("Backend content move is not authorized");
  }

  if (
    !before.client ||
    typeof before.client.updateAssignmentAndPosition !== "function"
  ) {
    throw new Error("Backend content move API is unavailable");
  }

  // No await between authorization check and request initiation.
  await before.client.updateAssignmentAndPosition({
    elementId: request.elementId,
    sourceMenuId: request.sourceMenuId,
    targetMenuId: request.targetMenuId,
    position: request.position,
  });

  const after = getContext();

  if (
    !isWritable(after) ||
    before.client !== after.client ||
    before.server !== after.server ||
    before.authGeneration !== after.authGeneration
  ) {
    // The server may already have applied the operation.
    throw new Error(
      "Backend content move completed in a stale session; reload required",
    );
  }
}

export interface MoveBackendContentFromStoreParams {
  request: UpdateContentAssignmentRequest;
  getState: () => TemplateRootState;
}

export function moveBackendContentElementFromStoreV2({
  request,
  getState,
}: MoveBackendContentFromStoreParams): Promise<void> {
  return moveBackendContentElementV2({
    request,
    getContext: () => {
      const state = getState();

      return {
        ...selectBackendContentWriteContext(state),
        client: state.api.dynamic_content_api_v2.defaultApi,
      };
    },
  });
}