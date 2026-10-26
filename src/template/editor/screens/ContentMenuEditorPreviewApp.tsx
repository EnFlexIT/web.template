import React from "react";

import {
  View,
} from "react-native";

import {
  ContentMenuEditorPreview,
} from "./ContentMenuEditorPreview";

/**
 * Isolated development entry.
 *
 * Uses the existing theme system.
 * Does not mount production navigation or
 * perform backend writes.
 */
export function ContentMenuEditorPreviewApp({
  applicationId,
}: {
  applicationId: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
      }}
    >
      <ContentMenuEditorPreview
        applicationId={applicationId}
      />
    </View>
  );
}
