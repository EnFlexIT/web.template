import type {
  CreateMenuRequest,
  CreateMenu201Response,
  MenuList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

import {
  buildBackendMenuPolicyV2,
  canCreateBackendSubmenuV2,
} from "./backendMenuPolicyV2";

export interface BackendMenuCreateClient {
  getMenus(
    lang?: string,
  ): Promise<{ data: MenuList }>;

  createMenu(
    request: CreateMenuRequest,
  ): Promise<{ data: CreateMenu201Response }>;
}

export interface BackendMenuCreateContext {
  client: BackendMenuCreateClient;
  server: string;
  authGeneration: number;
  isLoggedIn: boolean;
  canEdit: boolean;
  isSwitchingServer: boolean;
  isLoggingOut: boolean;
}

export interface CreateBackendMenuParams {
  caption: string;
  parentId: number | null;
  language: string;
  allowedRoles: readonly string[];
  getContext: () => BackendMenuCreateContext;
}

function isWritable(
  context: BackendMenuCreateContext,
): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    typeof context.server === "string" &&
    context.server.trim().length > 0 &&
    Number.isSafeInteger(context.authGeneration)
  );
}

function isSameSession(
  before: BackendMenuCreateContext,
  after: BackendMenuCreateContext,
): boolean {
  return (
    before.client === after.client &&
    before.server === after.server &&
    before.authGeneration === after.authGeneration &&
    isWritable(after)
  );
}

export async function createBackendMenuV2({
  caption,
  parentId,
  language,
  allowedRoles,
  getContext,
}: CreateBackendMenuParams): Promise<number> {
  const name = caption.trim();

  if (!name) {
    throw new Error("Backend menu caption is required");
  }

  if (name.length > 120) {
    throw new Error("Backend menu caption is too long");
  }

  if (!language.trim()) {
    throw new Error("Backend menu language is required");
  }

  if (
    parentId !== null &&
    (!Number.isSafeInteger(parentId) || parentId <= 0)
  ) {
    throw new Error("Invalid parent menu ID");
  }

  if (
    !Array.isArray(allowedRoles) ||
    allowedRoles.some(
      role => typeof role !== "string" || !role.trim(),
    )
  ) {
    throw new Error("Invalid menu access roles");
  }

  const before = { ...getContext() };

  if (!isWritable(before)) {
    throw new Error("Backend menu creation is not authorized");
  }

  const response = await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu inventory belongs to a stale session");
  }

  const items = response.data?.menuList;

  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const ids = new Set<number>();

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.menuId) ||
      item.menuId <= 0 ||
      ids.has(item.menuId)
    ) {
      throw new Error("Invalid backend menu inventory");
    }

    ids.add(item.menuId);
  }

  if (parentId !== null && !ids.has(parentId)) {
    throw new Error("Parent menu not found");
  }

  const policy = buildBackendMenuPolicyV2(items);

  if (
    parentId !== null &&
    !canCreateBackendSubmenuV2(policy, parentId)
  ) {
    throw new Error("create.maxDepthReached");
  }

  const siblings = items.filter(
    item => (item.parentId ?? null) === parentId,
  );

  for (const sibling of siblings) {
    if (
      !Number.isSafeInteger(sibling.position) ||
      sibling.position < 0
    ) {
      throw new Error("Invalid sibling menu position");
    }
  }

  const positions = siblings
    .map(item => item.position)
    .sort((a, b) => a - b);

  if (
    positions.some(
      (position, index) => position !== index + 1,
    )
  ) {
    throw new Error(
      "Invalid existing menu positions. Creation blocked.",
    );
  }

  const position = siblings.length + 1;

  const request: CreateMenuRequest = {
    allowedRoles: [...allowedRoles],
    content: {
      // Required by the generated TypeScript model.
      // The current Java converter does not copy this ID.
      menuId: 0,
      ...(parentId === null ? {} : { parentId }),
      isHeadMenu: parentId === null,
      position,
      caption: name,
    },
  };

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu session changed before creation");
  }

  const created = await before.client.createMenu(request);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu creation returned for a stale session");
  }

  const createdId = created.data?.menuId;

  if (
    !Number.isSafeInteger(createdId) ||
    createdId === undefined ||
    createdId <= 0
  ) {
    throw new Error("Backend did not return a valid menu ID");
  }

  if (ids.has(createdId)) {
    throw new Error(
      "Backend returned an existing menu ID. Reload before retrying.",
    );
  }

  const verification =
    await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error(
      "Menu creation verification returned for a stale session",
    );
  }

  const savedItems = verification.data?.menuList;

  if (!Array.isArray(savedItems)) {
    throw new Error(
      "Unable to verify created menu. Reload before retrying.",
    );
  }

  buildBackendMenuTreeV2(savedItems);

  const savedMenu = savedItems.find(
    item => item.menuId === createdId,
  );

  const problems: string[] = [];

  if (!savedMenu) {
    problems.push("Created menu is missing");
  } else {
    if ((savedMenu.parentId ?? null) !== parentId) {
      problems.push(
        `Parent ID: expected ${parentId ?? "root"}, ` +
        `actual ${savedMenu.parentId ?? "root"}`,
      );
    }

    if (savedMenu.position !== position) {
      problems.push(
        `Position: expected ${position}, ` +
        `actual ${savedMenu.position}`,
      );
    }

    if (savedMenu.caption !== name) {
      problems.push("Saved caption differs from requested caption");
    }

    if (savedMenu.isHeadMenu !== (parentId === null)) {
      problems.push("Incorrect head menu flag");
    }
  }

  const savedSiblings = savedItems
    .filter(item => (item.parentId ?? null) === parentId)
    .sort((a, b) => a.position - b.position);

  const expectedSiblingIds = [
    ...siblings
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(item => item.menuId),
    createdId,
  ];

  if (
    savedSiblings.length !== expectedSiblingIds.length ||
    savedSiblings.some(
      (item, index) =>
        item.menuId !== expectedSiblingIds[index] ||
        item.position !== index + 1,
    )
  ) {
    problems.push("Unexpected sibling order or positions");
  }

  if (problems.length > 0) {
    throw new Error(
      "Created menu could not be verified. " +
      `Menu ID: ${createdId}. ` +
      problems.join(". ") +
      ". Reload before retrying.",
    );
  }

  return createdId;
}