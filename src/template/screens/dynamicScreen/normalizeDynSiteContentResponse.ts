import type {
  AbstractSiteContent,
  SiteContentList,
} from "@/api/implementation/Dynamic-Content-Api";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeContent(value: unknown): AbstractSiteContent {
  if (!isRecord(value)) {
    throw new Error("Invalid DynSiteAPI content element");
  }

  const type =
    value.AbstractSiteContentType ??
    value.abstractSiteContentType;

  const id =
    value.uniqueContentID ??
    value.uniqueContentId;

  if (
    typeof type !== "string" ||
    type.trim().length === 0 ||
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    throw new Error("Invalid DynSiteAPI content fields");
  }

  return {
    ...value,
    AbstractSiteContentType: type,
    uniqueContentID: id,
  } as unknown as AbstractSiteContent;
}

/**
 * Accepts the legacy SiteContentList object and the current
 * backend array of positioned content entries.
 *
 * Invalid entries cause an explicit error rather than being
 * silently removed or displayed as an empty page.
 */
export function normalizeDynSiteContentResponse(
  response: unknown,
): SiteContentList {
  const raw = isRecord(response)
    ? response.contentList
    : response;

  if (!Array.isArray(raw)) {
    throw new Error(
      "Invalid DynSiteAPI content response: expected array or contentList",
    );
  }

  const entries = raw.map((entry, index) => {
    if (isRecord(entry) && "content" in entry) {
      if (
        typeof entry.position !== "number" ||
        !Number.isSafeInteger(entry.position) ||
        entry.position < 0
      ) {
        throw new Error("Invalid DynSiteAPI content position");
      }

      return {
        position: entry.position,
        index,
        content: normalizeContent(entry.content),
      };
    }

    if (isRecord(response)) {
      return {
        position: index,
        index,
        content: normalizeContent(entry),
      };
    }

    throw new Error("Invalid DynSiteAPI positioned content entry");
  });

  entries.sort(
    (a, b) =>
      a.position - b.position ||
      a.index - b.index,
  );

  return {
    contentList: entries.map(entry => entry.content),
  };
}
