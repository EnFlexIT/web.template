import type {
  UpdateContentElementRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export interface BackendContentWriteClient {
  updateContentElement(
    elementId: number,
    request: UpdateContentElementRequest,
  ): Promise<unknown>;
}

export interface BackendContentWriteContext {
  client: BackendContentWriteClient;
  server: string;
  authGeneration: number;
  isLoggedIn: boolean;
  canEdit: boolean;
  isSwitchingServer: boolean;
  isLoggingOut: boolean;
}

export interface UpdateBackendContentElementParams {
  elementId: number;
  request: UpdateContentElementRequest;
  getContext: () => BackendContentWriteContext;
}

function isWritable(context: BackendContentWriteContext): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    context.server.length > 0
  );
}

function isSameSession(
  before: BackendContentWriteContext,
  after: BackendContentWriteContext,
): boolean {
  return (
    before.client === after.client &&
    before.server === after.server &&
    before.authGeneration === after.authGeneration &&
    isWritable(after)
  );
}

export async function updateBackendContentElement({
  elementId,
  request,
  getContext,
}: UpdateBackendContentElementParams): Promise<void> {
  if (!Number.isSafeInteger(elementId) || elementId <= 0) {
    throw new Error("Invalid content element ID");
  }

  if (!request || !request.content) {
    throw new Error("Content update requires content");
  }

  const before = getContext();

  if (!isWritable(before)) {
    throw new Error("Backend content editing is not authorized");
  }

  // No await between the session check and request initiation.
  await before.client.updateContentElement(elementId, request);

  const after = getContext();

  if (!isSameSession(before, after)) {
    throw new Error("Backend content update returned for a stale session");
  }
}