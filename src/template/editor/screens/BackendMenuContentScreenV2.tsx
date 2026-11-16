import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useStore } from "react-redux";

import {
  ActionButton,
} from "@/template/components/design-system/ui-elements/ActionButton";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

import {
  sortBackendContentV2,
  planBackendContentReorderV2,
  type ReorderDirection,
} from "../adapters/planBackendContentReorderV2";

import {
  moveBackendContentElementFromStoreV2,
} from "../adapters/moveBackendContentElementV2";

import {
  removeBackendContentAssignmentFromStoreV2,
} from "../adapters/removeBackendContentAssignmentV2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  loadBackendMenuContentFromStore,
} from "../adapters/loadBackendMenuContentFromStore";

import type {
  BackendEditorBlockV2,
} from "../adapters/mapBackendContentToEditorV2";

import {
  BackendTextBlockEditorV2,
} from "../components/BackendTextBlockEditorV2";

import {
  ContentTextBlockViewer,
} from "../components/ContentTextBlockViewer";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";


import { BackendNewTextDraftV2 } from "../components/BackendNewTextDraftV2";
import { getNextAccordionSelection } from "../layout/backendAccordionSelection";

import { useBackendLiveContent } from "../context/BackendContentLivePreviewContext";

export interface BackendMenuContentScreenV2Props {
  menuId: number;
  mode?: "viewer" | "editor";
}

/**
 * Isolated V2 backend content screen.
 *
 * Not registered in navigation.
 * Does not use or modify local editor drafts.
 */
export function BackendMenuContentScreenV2({
  menuId,
  mode = "viewer",
}: BackendMenuContentScreenV2Props) {
  const editorMode = mode === "editor";
  const { width: windowWidth } = useWindowDimensions();
  const desktopSelectionEnabled = windowWidth >= 900;
  const store = useStore();
  const {
    getLiveBlockHtml,
    getLiveNewHtml,
    setLiveBlockHtml,
    refreshVersion,
    requestRefresh,
    getSelectedBlockId,
    setSelectedBlockId,
    requestDesktopSelection,
    setDesktopEditorStatus,
  } = useBackendLiveContent();

  const selectedBlockId = getSelectedBlockId(menuId);
  const desktopEditorMode = editorMode && desktopSelectionEnabled;
  const liveNewHtml = getLiveNewHtml(menuId);
  const requestVersion = useRef(0);

  const sessionKey = useAppSelector(state => {
    const api = state.api;

    return [
      api.ip,
      api.authGeneration,
      api.isLoggedIn,
      api.isLoggingOut,
      api.isSwitchingServer,
    ].join("|");
  });

  const scopeKey = `${menuId}|${sessionKey}`;

  // Updated during render, so a late async response sees the current scope.
  const currentMoveScopeRef = useRef(scopeKey);
  currentMoveScopeRef.current = scopeKey;

  const [blocks, setBlocks] = useState<BackendEditorBlockV2[]>([]);
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingMove, setPendingMove] = useState<{
    elementId: number;
    direction: ReorderDirection;
    scopeKey: string;
  } | null>(null);

  const [moving, setMoving] = useState(false);
  const [moveMessage, setMoveMessage] = useState("");
  const moveBusyRef = useRef(false);

  const [pendingRemoval, setPendingRemoval] = useState<{
    elementId: number;
    scopeKey: string;
  } | null>(null);

  const [removing, setRemoving] = useState(false);
  const [removeMessage, setRemoveMessage] = useState("");
  const removeBusyRef = useRef(false);

  const canMove = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.trim().length > 0
    );
  });

  useEffect(() => {
    setPendingMove(null);
    setMoveMessage("");
    setPendingRemoval(null);
    setRemoveMessage("");
    setExpandedBlockId(null);
  }, [scopeKey]);

  const getState = useCallback(
    () => store.getState() as TemplateRootState,
    [store],
  );

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;

    setLoading(true);
    setError("");

    try {
      const result = await loadBackendMenuContentFromStore({
        menuId,
        getState,
      });

      if (version !== requestVersion.current) {
        return;
      }

      setBlocks(sortBackendContentV2(result));
      setLoadedScope(scopeKey);
    } catch {
      if (version !== requestVersion.current) {
        return;
      }

      setBlocks([]);
      setLoadedScope(null);
      setError(
        "Backend-Inhalte konnten nicht geladen werden. " +
        "Bitte Anmeldung und Serververbindung pruefen.",
      );

      throw new Error("Backend content reload failed");
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [menuId, getState, scopeKey]);

  useEffect(() => {
    void reload().catch(() => {
      // The error is already displayed by reload().
    });

    return () => {
      requestVersion.current += 1;
    };
  }, [reload, refreshVersion]);

  const ready = loadedScope === scopeKey;

  const requestMove = (
    elementId: number,
    direction: ReorderDirection,
  ) => {
    if (
      moveBusyRef.current ||
      removeBusyRef.current ||
      loading ||
      !ready ||
      !canMove
    ) {
      return;
    }

    try {
      const planned = planBackendContentReorderV2(
        blocks,
        menuId,
        elementId,
        direction,
      );

      if (!planned) {
        return;
      }

      setPendingMove({ elementId, direction, scopeKey });
      setMoveMessage("");
    } catch {
      setPendingMove(null);
      setMoveMessage(
        "Sortierung nicht eindeutig. Bitte Backend-Inhalte neu laden.",
      );
    }
  };

  const confirmMove = async () => {
    const pending = pendingMove;

    if (
      !pending ||
      pending.scopeKey !== currentMoveScopeRef.current ||
      moveBusyRef.current ||
      removeBusyRef.current ||
      loading ||
      !ready ||
      !canMove
    ) {
      return;
    }

    const moveScope = currentMoveScopeRef.current;

    moveBusyRef.current = true;
    setMoving(true);
    setPendingMove(null);
    setMoveMessage("");

    try {
      const request = planBackendContentReorderV2(
        blocks,
        menuId,
        pending.elementId,
        pending.direction,
      );

      if (!request) {
        return;
      }

      await moveBackendContentElementFromStoreV2({
        request,
        getState,
      });

      // A response from an old menu/session must not update this view.
      if (currentMoveScopeRef.current !== moveScope) {
        return;
      }

      try {
        await reload();

        if (currentMoveScopeRef.current !== moveScope) {
          return;
        }

        setMoveMessage(
          "Sortierung gespeichert und Backend-Inhalte neu geladen.",
        );
      } catch {
        if (currentMoveScopeRef.current !== moveScope) {
          return;
        }

        setMoveMessage(
          "Speicherung bestaetigt, aber erneutes Laden fehlgeschlagen. " +
          "Bitte Serverinhalt vor einer weiteren Aenderung pruefen.",
        );
      }
    } catch {
      if (currentMoveScopeRef.current !== moveScope) {
        return;
      }

      setMoveMessage(
        "Sortierung fehlgeschlagen oder Ergebnis nicht sicher bestaetigt. " +
        "Bitte Serverinhalt pruefen, bevor du erneut sortierst.",
      );

      try {
        await reload();
      } catch {
        // reload() already displays its own loading error.
      }
    } finally {
      moveBusyRef.current = false;
      setMoving(false);
    }
  };

  const hasUnsavedPreview = () =>
    liveNewHtml !== null ||
    blocks.some(block => {
      if (block.kind !== "text") {
        return false;
      }

      const draft = getLiveBlockHtml(menuId, block.backendContentId);

      return draft !== undefined && draft !== block.html;
    });

  const requestRemoval = (elementId: number) => {
    if (
      !editorMode ||
      !canMove ||
      !ready ||
      loading ||
      moving ||
      moveBusyRef.current ||
      removeBusyRef.current
    ) {
      return;
    }

    const block = blocks.find(
      item => item.backendContentId === elementId,
    );

    if (
      !block ||
      block.kind !== "text" ||
      !block.editable
    ) {
      return;
    }

    if (hasUnsavedPreview()) {
      setRemoveMessage(
        "Ungespeicherte Aenderungen vorhanden. " +
        "Bitte zuerst speichern oder den Entwurf verwerfen.",
      );

      return;
    }

    setPendingMove(null);
    setPendingRemoval({ elementId, scopeKey });
    setRemoveMessage("");
  };

  const confirmRemoval = async () => {
    const pending = pendingRemoval;

    if (
      !pending ||
      pending.scopeKey !== currentMoveScopeRef.current ||
      !editorMode ||
      !canMove ||
      !ready ||
      loading ||
      moving ||
      moveBusyRef.current ||
      removeBusyRef.current
    ) {
      return;
    }

    const block = blocks.find(
      item => item.backendContentId === pending.elementId,
    );

    if (
      !block ||
      block.kind !== "text" ||
      !block.editable
    ) {
      setPendingRemoval(null);
      return;
    }

    if (hasUnsavedPreview()) {
      setPendingRemoval(null);

      setRemoveMessage(
        "Entfernen abgebrochen: Ungespeicherte Aenderungen vorhanden.",
      );

      return;
    }

    const removalScope = currentMoveScopeRef.current;

    removeBusyRef.current = true;
    setRemoving(true);
    setPendingRemoval(null);
    setRemoveMessage("");

    try {
      await removeBackendContentAssignmentFromStoreV2({
        menuId,
        elementId: pending.elementId,
        getState,
      });

      if (currentMoveScopeRef.current !== removalScope) {
        return;
      }

      setExpandedBlockId(current =>
        current === pending.elementId ? null : current,
      );

      requestRefresh(menuId);

      setRemoveMessage(
        `Inhalt #${pending.elementId} wurde aus dem Menue entfernt. ` +
        "Die Backend-Ansichten werden aktualisiert.",
      );
    } catch (error: unknown) {
      if (currentMoveScopeRef.current !== removalScope) {
        return;
      }

      // Never expose authorization headers, tokens or response bodies.
      const responseStatus =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        typeof error.response.status === "number"
          ? error.response.status
          : null;

      const statusText =
        responseStatus !== null
          ? `HTTP ${responseStatus}`
          : "Kein HTTP-Status verfuegbar";

      // A failed response does not guarantee that the server
      // left the assignment unchanged. Never retry automatically.
      requestRefresh(menuId);

      setRemoveMessage(
        `Entfernen nicht bestaetigt (${statusText}). ` +
        "Bitte Backend-Inhalte pruefen und nicht automatisch erneut entfernen.",
      );
    } finally {
      removeBusyRef.current = false;
      setRemoving(false);
    }
  };
  const renderMoveActions = (
    elementId: number,
    index: number,
    compact = false,
  ) => {
    if (!canMove || moving || removing || !ready || loading) {
      return null;
    }

    return (
      <View style={{ flexDirection: "row", gap: compact ? 4 : 8, flexWrap: compact ? "nowrap" : "wrap" }}>
        {(desktopEditorMode || index > 0) && (
          <ActionButton
            label={compact ? undefined : "Nach oben"}
            icon={compact ? "arrow-up" : undefined}
            iconSize={18}
            tooltip={compact ? "Nach oben verschieben" : undefined}
            variant="secondary"
            disabled={desktopEditorMode && index === 0}
            onPress={() => requestMove(elementId, "up")}
          />
        )}
        {(desktopEditorMode || index < blocks.length - 1) && (
          <ActionButton
            label={compact ? undefined : "Nach unten"}
            icon={compact ? "arrow-down" : undefined}
            iconSize={18}
            tooltip={compact ? "Nach unten verschieben" : undefined}
            variant="secondary"
            disabled={desktopEditorMode && index === blocks.length - 1}
            onPress={() => requestMove(elementId, "down")}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 16 }}>
        <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
          {editorMode ? "Backend bearbeiten" : "Backend-Inhalte"}: Menue #{menuId}
        </ThemedText>


        {editorMode && canMove && (
          <BackendNewTextDraftV2
            key={scopeKey}
            menuId={menuId}
            position={blocks.length + 1}
            getState={getState}
            onSaved={reload}
          />
        )}

        {loading && (
          <ThemedText>
            Backend-Inhalte werden geladen ...
          </ThemedText>
        )}

        {!!error && (
          <ThemedText>{error}</ThemedText>
        )}

        {!!moveMessage && (
          <ThemedText>{moveMessage}</ThemedText>
        )}

        {!!removeMessage && (
          <ThemedText>{removeMessage}</ThemedText>
        )}

        {removing && (
          <ThemedText>
            Inhalt wird entfernt. Bitte warten.
          </ThemedText>
        )}

        {editorMode &&
         pendingRemoval &&
         !removing &&
         pendingRemoval.scopeKey === scopeKey &&
         ready && (
          <View
            style={{
              gap: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: "#c88",
            }}
          >
            <ThemedText style={{ fontWeight: "600" }}>
              Inhalt #{pendingRemoval.elementId} wirklich aus diesem Menue entfernen?
            </ThemedText>

            <ThemedText>
              Achtung: Falls dieser Inhalt keinem weiteren Menue
              zugeordnet ist, kann das Backend ihn vollstaendig
              loeschen. Diese Aktion laesst sich nicht automatisch
              rueckgaengig machen.
            </ThemedText>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <ActionButton
                label="Entfernen bestaetigen"
                onPress={() => void confirmRemoval()}
              />

              <ActionButton
                label="Abbrechen"
                variant="secondary"
                onPress={() => setPendingRemoval(null)}
              />
            </View>
          </View>
        )}

        {moving && (
          <ThemedText>
            Sortierung wird gespeichert. Bitte keine weitere Aktion starten.
          </ThemedText>
        )}

        {editorMode && pendingMove && !moving && ready && (
          <View style={{ gap: 8 }}>
            <ThemedText>
              Inhalt #{pendingMove.elementId} wirklich
              {pendingMove.direction === "up"
                ? " nach oben"
                : " nach unten"} verschieben?
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ActionButton
                label="Verschieben bestaetigen"
                onPress={() => void confirmMove()}
              />
              <ActionButton
                label="Abbrechen"
                variant="secondary"
                onPress={() => setPendingMove(null)}
              />
            </View>
          </View>
        )}

        {!loading && ready && blocks.length === 0 && (
          <ThemedText>
            Fuer dieses Menue sind keine Inhalte vorhanden.
          </ThemedText>
        )}

        {!loading && ready && blocks.map((block, index) => {
          const key = String(block.backendContentId);

          if (desktopEditorMode) {
            const activeId =
              selectedBlockId !== null &&
              blocks.some(item => item.backendContentId === selectedBlockId)
                ? selectedBlockId
                : blocks.find(item => item.kind === "text")?.backendContentId ??
                  blocks[0]?.backendContentId;

            if (block.backendContentId !== activeId) {
              return null;
            }
          }

          if (block.kind !== "text") {
            return (
              <View key={key} style={{ gap: 8 }}>
                <ThemedText>
                  Inhalt #{block.backendContentId}:
                  Dieser Inhaltstyp wird hier nicht bearbeitet.
                </ThemedText>
                {editorMode && renderMoveActions(block.backendContentId, index)}
              </View>
            );
          }

          const isHtml =
            block.original.mimeType
              .toLowerCase()
              .split(";")[0]
              .trim() === "text/html";

          const expanded = desktopEditorMode || expandedBlockId === block.backendContentId;

          return (
            <View
              key={key}
              style={editorMode ? {
                gap: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "#d0d0d0",
              } : {
                gap: 12,
                padding: 10,
                borderWidth: 2,
                borderRadius: 6,
                borderColor:
                  selectedBlockId === block.backendContentId
                    ? "#3884d6"
                    : "transparent",
                backgroundColor:
                  selectedBlockId === block.backendContentId
                    ? "rgba(56,132,214,0.08)"
                    : "transparent",
              }}
            >
              {editorMode ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Textinhalt ${block.backendContentId} ${expanded ? "schliessen" : "oeffnen"}`}
                  accessibilityState={{ expanded }}
                  testID={`backend-accordion-${block.backendContentId}`}
                  onPress={() => {
                    if (desktopEditorMode) {
                      return;
                    }

                    const next = getNextAccordionSelection(
                      expandedBlockId,
                      block.backendContentId,
                    );

                    setExpandedBlockId(next);
                    setSelectedBlockId(menuId, next);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ThemedText style={{ fontWeight: "600" }}>
                    {desktopEditorMode ? "Ausgewählter Text" : `Textinhalt #${block.backendContentId}`}
                  </ThemedText>
                  <ThemedText>
                    {!block.editable ? "Gesperrt  " : ""}
                    {!desktopEditorMode && (expanded ? "▲" : "▼")}
                  </ThemedText>
                </Pressable>
                {renderMoveActions(block.backendContentId, index, true)}

                {canMove &&
                 block.editable &&
                 !removing &&
                 !moving && (
                  <ActionButton
                    icon="delete"
                    iconSize={18}
                    tooltip="Inhalt entfernen"
                    variant="secondary"
                    onPress={() => requestRemoval(block.backendContentId)}
                  />
                )}
                </View>
              ) : (
                !desktopSelectionEnabled && (
                  <ThemedText style={{ fontWeight: "600" }}>
                    Textinhalt #{block.backendContentId}
                  </ThemedText>
                )
              )}

              {!editorMode && (
                <Pressable
                  disabled={!desktopSelectionEnabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Textinhalt ${block.backendContentId} auswaehlen`}
                  accessibilityState={{
                    selected: selectedBlockId === block.backendContentId,
                    disabled: !desktopSelectionEnabled,
                  }}
                  testID={`backend-preview-select-${block.backendContentId}`}
                  onPress={() => {
                    requestDesktopSelection(menuId, block.backendContentId);
                  }}
                  style={{ minWidth: 0, alignItems: "flex-start", alignSelf: "stretch" }}
                >
                  {isHtml ? (
                    <ContentTextBlockViewer
                      html={getLiveBlockHtml(menuId, block.backendContentId) ?? block.html}
                    />
                  ) : (
                    <ThemedText>{block.original.text}</ThemedText>
                  )}
                </Pressable>
              )}

              {editorMode && (
                <View style={{ display: expanded ? "flex" : "none", gap: 12 }}>
                  {isHtml && block.editable ? (
                    <BackendTextBlockEditorV2
                      block={block}
                      desktopCompact={desktopEditorMode}
                      onSaved={reload}
                      onDraftChange={value =>
                        setLiveBlockHtml(menuId, block.backendContentId, value)
                      }
                      onEditingStateChange={desktopEditorMode
                        ? (_editing, saving, dirty) =>
                            setDesktopEditorStatus(
                              menuId,
                              block.backendContentId,
                              dirty,
                              saving,
                            )
                        : undefined}
                    />
                  ) : (
                    <ThemedText>
                      {!block.editable
                        ? "Dieser Inhalt ist vom Backend nicht zur Bearbeitung freigegeben."
                        : "Dieser Inhalt ist kein HTML-Text und wird hier nur angezeigt."}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          );
        })}
        {!editorMode && !loading && ready && liveNewHtml !== null && (
          <View style={{ gap: 10 }}>
            <ThemedText style={{ fontWeight: "600" }}>
              Neuer Textinhalt (lokaler Entwurf – nicht gespeichert)
            </ThemedText>
            <ContentTextBlockViewer html={liveNewHtml} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}