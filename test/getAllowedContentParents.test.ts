import type { EditorMenuEntry } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import { getAllowedContentParents } from "../src/template/editor/utils/getAllowedContentParents";

const root: EditorMenuEntry = {
  id: "static:3900",
  source: "application",
  caption: "Application",
  position: 1,
};

const protectedEntries = [
  { original: root },
] as ProtectedMenuEntry[];

const inventory: TrustedMenuInventory = {
  applicationId: "test-app",
  staticMenuIds: ["static:3900"],
};

const policy = {
  allowedContentParentIds: ["static:3900"],
};

function folder(id: string, parentId: string): EditorMenuEntry {
  return {
    id,
    source: "content",
    caption: id,
    parentId,
    position: 1,
  };
}

function allowedIds(
  entries: EditorMenuEntry[],
  protectedItems = protectedEntries,
  trustedInventory = inventory,
): string[] {
  return getAllowedContentParents(
    entries,
    policy,
    protectedItems,
    trustedInventory,
  ).map(entry => entry.id);
}

describe("getAllowedContentParents", () => {
  it("allows the trusted application root", () => {
    expect(allowedIds([root])).toEqual(["static:3900"]);
  });

  it("allows a content folder under the trusted root", () => {
    expect(allowedIds([
      root,
      folder("content:docs", root.id),
    ])).toEqual(["static:3900", "content:docs"]);
  });

  it("allows nested content folders", () => {
    expect(allowedIds([
      root,
      folder("content:docs", root.id),
      folder("content:examples", "content:docs"),
    ])).toEqual([
      "static:3900",
      "content:docs",
      "content:examples",
    ]);
  });

  it("excludes content pages as parents", () => {
    expect(allowedIds([
      root,
      {
        ...folder("content:page", root.id),
        contentPageId: "page:1",
      },
    ])).toEqual(["static:3900"]);
  });

  it("excludes folders outside the allowed subtree", () => {
    expect(allowedIds([
      root,
      {
        id: "static:other",
        source: "application",
        caption: "Other",
        position: 2,
      },
      folder("content:outside", "static:other"),
    ])).toEqual(["static:3900"]);
  });

  it("rejects an untrusted root", () => {
    expect(allowedIds(
      [root, folder("content:docs", root.id)],
      [],
    )).toEqual([]);
  });

  it("rejects a root missing from the trusted inventory", () => {
    expect(allowedIds(
      [root, folder("content:docs", root.id)],
      protectedEntries,
      { applicationId: "test-app", staticMenuIds: [] },
    )).toEqual([]);
  });

  it("rejects a content entry posing as the trusted root", () => {
    expect(allowedIds([
      { ...root, source: "content" },
      folder("content:child", root.id),
    ])).toEqual([]);
  });

  it("rejects a folder nested beneath a content page", () => {
    expect(allowedIds([
      root,
      {
        ...folder("content:page", root.id),
        contentPageId: "page:1",
      },
      folder("content:child", "content:page"),
    ])).toEqual(["static:3900"]);
  });

  it("rejects cyclic content folders", () => {
    expect(allowedIds([
      root,
      folder("content:a", "content:b"),
      folder("content:b", "content:a"),
    ])).toEqual(["static:3900"]);
  });
});