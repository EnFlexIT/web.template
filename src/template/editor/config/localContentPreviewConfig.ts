/**
 * Explicit development-only switch for local
 * content-menu sidebar previews.
 *
 * This is not an authorization mechanism.
 */
export function isLocalContentPreviewEnabled(): boolean {
  return (
    __DEV__ === true &&
    process.env.EXPO_PUBLIC_CONTENT_MENU_PREVIEW === "true"
  );
}