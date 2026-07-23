import { ServerEnvironment } from "../../redux/slices/serverSlice";

export function detectServerEnvironment(
  url: string,
): ServerEnvironment {
  const normalizedUrl = url.toLowerCase();

  if (
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("dev")
  ) {
    return "DEV";
  }

  if (
    normalizedUrl.includes("test") ||
    normalizedUrl.includes("staging")
  ) {
    return "TEST";
  }

  return "PROD";
}