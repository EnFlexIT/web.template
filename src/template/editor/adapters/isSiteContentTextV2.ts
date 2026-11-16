import type {
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export function isSiteContentTextV2(
  value: unknown,
): value is SiteContentText {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return (
    content.abstractSiteContentType === "SiteContentText" &&
    typeof content.uniqueContentId === "number" &&
    Number.isSafeInteger(content.uniqueContentId) &&
    content.uniqueContentId > 0 &&
    typeof content.editable === "boolean" &&
    typeof content.updatePeriodInSeconds === "number" &&
    Number.isSafeInteger(content.updatePeriodInSeconds) &&
    content.updatePeriodInSeconds >= 0 &&
    typeof content.mimeType === "string" &&
    content.mimeType.trim().length > 0 &&
    typeof content.text === "string"
  );
}