import { BackendMenuTreeV2 } from "../components/BackendMenuTreeV2";
import { useTranslation } from "react-i18next";
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
  executeBackendContentOrderSaveV2,
  BackendOrderSaveError,
} from "../adapters/executeBackendContentOrderSaveV2";

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

import {
  executeBackendContentRemovalV2,
  BackendContentRemovalError,
} from "../adapters/executeBackendContentRemovalV2";

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
  const { t } = useTranslation(["Editor"]);
  const editorMode = mode === "editor";
  const { width: windowWidth } = useWindowDimensions();
  const desktopSelectionEnabled = windowWidth >= 900;
  const store = useStore();
  const {
    getLiveBlockHtml,
    getLiveNewHtml,
    getLiveOrder,
    getOriginalOrder,
    setLiveOrder,
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
  const [desktopEditRequest, setDesktopEditRequest] = useState<{
    elementId: number;
    version: number;
  } | null>(null);
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

  const moveMessageSuccess = [
    "backendContent.orderSaved",
    "backendContent.orderReloaded",
  ].includes(moveMessage);

  const moveMessageWarning = [
    "backendContent.orderPartial",
    "backendContent.orderUncertain",
    "backendContent.orderReloadFailed",
  ].includes(moveMessage);

  useEffect(() => {
    if (!moveMessageSuccess) {
      return;
    }

    const timeout = setTimeout(() => {
      setMoveMessage("");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [moveMessage, moveMessageSuccess]);

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
        "backendContent.loadFailed",
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

  const createOperationGuard = () => {
    const initial = {
      ...selectBackendContentWriteContext(getState()),
    };

    const initialScope = currentMoveScopeRef.current;

    return () => {
      const current =
        selectBackendContentWriteContext(getState());

      return (
        currentMoveScopeRef.current === initialScope &&
        current.client === initial.client &&
        current.server === initial.server &&
        current.authGeneration === initial.authGeneration &&
        current.isLoggedIn &&
        current.canEdit &&
        !current.isLoggingOut &&
        !current.isSwitchingServer
      );
    };
  };

  const liveOrder = desktopSelectionEnabled
    ? getLiveOrder(menuId)
    : null;

  const originalOrder = desktopSelectionEnabled
    ? getOriginalOrder(menuId)
    : null;

  const baselineIds = originalOrder
    ? [...originalOrder]
        .sort((a, b) => a.position - b.position)
        .map(entry => entry.backendContentId)
    : blocks.map(block => block.backendContentId);

  const validLiveOrder =
    liveOrder !== null &&
    liveOrder.length === blocks.length &&
    new Set(liveOrder).size === liveOrder.length &&
    liveOrder.every(id =>
      blocks.some(block => block.backendContentId === id),
    );

  const displayedBlocks = validLiveOrder
    ? [...blocks].sort(
        (a, b) =>
          liveOrder.indexOf(a.backendContentId) -
          liveOrder.indexOf(b.backendContentId),
      )
    : blocks;

  const hasLocalReorder =
    validLiveOrder &&
    displayedBlocks.some(
      (block, index) =>
        block.backendContentId !== baselineIds[index],
    );

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

    if (desktopEditorMode) {
      const ids = displayedBlocks.map(block => block.backendContentId);
      const index = ids.indexOf(elementId);

      if (index < 0) {
        return;
      }

      const targetIndex =
        direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= ids.length) {
        return;
      }

      const nextIds = [...ids];

      [nextIds[index], nextIds[targetIndex]] = [
        nextIds[targetIndex],
        nextIds[index],
      ];

      setLiveOrder(
        menuId,
        nextIds,
        blocks.map(block => ({
          backendContentId: block.backendContentId,
          position: block.position,
        })),
      );
      setMoveMessage("");
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
        "backendContent.orderAmbiguous",
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

      const ordered = sortBackendContentV2(blocks);
      const desiredIds = ordered.map(
        block => block.backendContentId,
      );

      const sourceIndex = desiredIds.indexOf(
        request.elementId,
      );

      desiredIds.splice(sourceIndex, 1);
      desiredIds.splice(
        request.position - 1,
        0,
        request.elementId,
      );

      await executeBackendContentOrderSaveV2({
        menuId,
        original: ordered,
        desiredIds,
        load: () =>
          loadBackendMenuContentFromStore({
            menuId,
            getState,
          }),
        move: request =>
          moveBackendContentElementFromStoreV2({
            request,
            getState,
          }),
        isCurrent: createOperationGuard(),
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
          "backendContent.orderReloaded",
        );
      } catch {
        if (currentMoveScopeRef.current !== moveScope) {
          return;
        }

        setMoveMessage(
          "backendContent.orderReloadFailed",
        );
      }
    } catch {
      if (currentMoveScopeRef.current !== moveScope) {
        return;
      }

      setMoveMessage(
        "backendContent.orderUncertain",
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

  const saveLiveOrder = async () => {
    if (
      !desktopEditorMode ||
      !hasLocalReorder ||
      !liveOrder ||
      !ready ||
      loading ||
      moving ||
      removing ||
      !canMove ||
      moveBusyRef.current ||
      removeBusyRef.current
    ) {
      return;
    }

    if (hasUnsavedPreview()) {
      setMoveMessage(
        "backendContent.unsavedText",
      );
      return;
    }

    const saveScope = currentMoveScopeRef.current;
    const desiredIds = [...liveOrder];
    const isCurrent = createOperationGuard();
    let backendVerified = false;

    moveBusyRef.current = true;
    setMoving(true);
    setMoveMessage("");
    setPendingMove(null);

    try {
      await executeBackendContentOrderSaveV2({
        menuId,
        original: originalOrder ?? blocks,
        desiredIds,
        load: () =>
          loadBackendMenuContentFromStore({
            menuId,
            getState,
          }),
        move: request =>
          moveBackendContentElementFromStoreV2({
            request,
            getState,
          }),
        isCurrent,
      });

      backendVerified = true;

      if (currentMoveScopeRef.current !== saveScope) {
        return;
      }

      // Backend wurde bestätigt. Jetzt die Anzeige aktualisieren.
      await reload();

      if (currentMoveScopeRef.current !== saveScope) {
        return;
      }

      setLiveOrder(menuId, null);
      requestRefresh(menuId);

      setMoveMessage(
        "backendContent.orderSaved",
      );
    } catch (error) {
      if (currentMoveScopeRef.current !== saveScope) {
        return;
      }

      const attemptedWrites =
        error instanceof BackendOrderSaveError
          ? error.attemptedWrites
          : 0;

      if (backendVerified) {
        setLiveOrder(menuId, null);

        setMoveMessage(
          "backendContent.orderReloadFailed",
        );

        requestRefresh(menuId);
      } else if (attemptedWrites > 0) {
        setMoveMessage(
          "backendContent.orderPartial",
        );

        // Nach einem möglichen Schreibzugriff den tatsächlichen
        // Backend-Zustand laden. Lokalen Entwurf behalten.
        try {
          await reload();
        } catch {
          // reload() zeigt den Ladefehler bereits an.
        }
      } else {
        setMoveMessage(
          "backendContent.orderAborted",
        );
      }
    } finally {
      moveBusyRef.current = false;
      setMoving(false);
    }
  };
  const requestRemoval = (elementId: number) => {
    if (desktopEditorMode && hasLocalReorder) {
      setRemoveMessage(
        "backendContent.unsavedOrder",
      );
      return;
    }

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
        "backendContent.removeUnsaved",
      );

      return;
    }

    setPendingMove(null);
    setPendingRemoval({ elementId, scopeKey });
    setRemoveMessage("");
  };

  const confirmRemoval = async () => {
    if (hasLocalReorder) {
      setPendingRemoval(null);

      setRemoveMessage(
        "backendContent.unsavedOrder",
      );

      return;
    }

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
        "backendContent.removeAbortedDraft",
      );

      return;
    }

    const removalScope = currentMoveScopeRef.current;

    removeBusyRef.current = true;
    setRemoving(true);
    setPendingRemoval(null);
    setRemoveMessage("");

    try {
      await executeBackendContentRemovalV2({
        elementId: pending.elementId,
        original: blocks,
        load: () =>
          loadBackendMenuContentFromStore({
            menuId,
            getState,
          }),
        remove: () =>
          removeBackendContentAssignmentFromStoreV2({
            menuId,
            elementId: pending.elementId,
            getState,
          }),
        isCurrent: createOperationGuard(),
      });

      if (currentMoveScopeRef.current !== removalScope) {
        return;
      }

      setExpandedBlockId(current =>
        current === pending.elementId ? null : current,
      );

      requestRefresh(menuId);

      setRemoveMessage(
        "backendContent.removeSuccess",
      );
    } catch (error: unknown) {
      if (currentMoveScopeRef.current !== removalScope) {
        return;
      }

      if (
        error instanceof BackendContentRemovalError &&
        !error.attemptedWrite
      ) {
        setRemoveMessage(
          "backendContent.removeAborted",
        );

        requestRefresh(menuId);
        return;
      }

      requestRefresh(menuId);
      setRemoveMessage("backendContent.removeUncertain");

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
            label={compact ? undefined : t("backendContent.moveUp")}
            icon={compact ? "arrow-up" : undefined}
            iconSize={18}
            tooltip={compact ? t("backendContent.moveUpHint") : undefined}
            variant="secondary"
            disabled={desktopEditorMode && index === 0}
            onPress={() => requestMove(elementId, "up")}
          />
        )}
        {(desktopEditorMode || index < blocks.length - 1) && (
          <ActionButton
            label={compact ? undefined : t("backendContent.moveDown")}
            icon={compact ? "arrow-down" : undefined}
            iconSize={18}
            tooltip={compact ? t("backendContent.moveDownHint") : undefined}
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
          {editorMode ? t("backendContent.editTitle") : t("backendContent.viewTitle")}: {t("backendContent.menu")} #{menuId}
        </ThemedText>

        {editorMode && canMove && (
          <BackendMenuTreeV2
            selectedMenuId={menuId}
            selectionDisabled
          />
        )}


        {editorMode &&
          canMove &&
          ready &&
          !loading &&
          !moving &&
          !removing &&
          !hasLocalReorder && (
          <BackendNewTextDraftV2
            key={scopeKey}
            menuId={menuId}
            position={blocks.length + 1}
            getState={getState}
            onSaved={reload}
          />
        )}

        {loading && (
          <ThemedText>{t("backendContent.loading")}</ThemedText>
        )}

        {!!error && (
          <ThemedText>{t(error)}</ThemedText>
        )}

        {!!moveMessage && (
          <View
            testID="backend-order-save-notification"
            accessibilityRole="alert"
            style={{
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              gap: 6,
              backgroundColor: moveMessageSuccess
                ? "#e8f5e9"
                : moveMessageWarning
                  ? "#fff3e0"
                  : "#ffebee",
              borderColor: moveMessageSuccess
                ? "#81c784"
                : moveMessageWarning
                  ? "#ffb74d"
                  : "#e57373",
            }}
          >
            <ThemedText
              style={{
                fontWeight: "700",
                color: moveMessageSuccess
                  ? "#1b5e20"
                  : moveMessageWarning
                    ? "#8a4b00"
                    : "#b71c1c",
              }}
            >
              {moveMessageSuccess
                ? t("backendContent.orderSuccessTitle")
                : moveMessageWarning
                  ? t("backendContent.orderWarningTitle")
                  : t("backendContent.orderErrorTitle")}
            </ThemedText>

            <ThemedText
              style={{
                color: moveMessageSuccess
                  ? "#1b5e20"
                  : moveMessageWarning
                    ? "#8a4b00"
                    : "#b71c1c",
              }}
            >
              {t(moveMessage)}
            </ThemedText>
          </View>
        )}

        {!!removeMessage && (
          <ThemedText>{t(removeMessage)}</ThemedText>
        )}

        {removing && (
          <ThemedText>{t("backendContent.removing")}</ThemedText>
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
              {t("backendContent.confirmRemoval", { id: pendingRemoval.elementId })}
            </ThemedText>

            <ThemedText>{t("backendContent.removeWarning")}</ThemedText>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <ActionButton
                label={t("backendContent.confirmRemove")}
                onPress={() => void confirmRemoval()}
              />

              <ActionButton
                label={t("backendContent.cancel")}
                variant="secondary"
                onPress={() => setPendingRemoval(null)}
              />
            </View>
          </View>
        )}

        {desktopEditorMode && hasLocalReorder && !moving && !removing && (
          <View style={{ gap: 8 }}>
            <ThemedText>{t("backendContent.orderPreview")}</ThemedText>
            <ActionButton
              label={t("backendContent.saveOrder")}
              onPress={() => void saveLiveOrder()}
            />
            <ActionButton
              label={t("backendContent.discardOrder")}
              variant="secondary"
              onPress={() => {
                setLiveOrder(menuId, null);
                setPendingMove(null);
                setMoveMessage("");
              }}
            />
          </View>
        )}

        {moving && (
          <ThemedText>{t("backendContent.orderSaving")}</ThemedText>
        )}

        {editorMode && pendingMove && !moving && ready && (
          <View style={{ gap: 8 }}>
            <ThemedText>
              {t(
                pendingMove.direction === "up"
                  ? "backendContent.confirmMoveUp"
                  : "backendContent.confirmMoveDown",
                { id: pendingMove.elementId },
              )}
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ActionButton
                label={t("backendContent.confirmMove")}
                onPress={() => void confirmMove()}
              />
              <ActionButton
                label={t("backendContent.cancel")}
                variant="secondary"
                onPress={() => setPendingMove(null)}
              />
            </View>
          </View>
        )}

        {!loading && ready && blocks.length === 0 && (
          <ThemedText>{t("backendContent.empty")}</ThemedText>
        )}

        {desktopEditorMode &&
         !loading &&
         ready &&
         blocks.length > 0 &&
         (selectedBlockId === null ||
           !blocks.some(item => item.backendContentId === selectedBlockId)) && (
          <View
            testID="backend-desktop-no-selection"
            style={{
              padding: 12,
              gap: 12,
              borderWidth: 1,
              borderColor: "#d0d0d0",
              backgroundColor: "#f2f2f2",
              opacity: 0.65,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <ThemedText style={{ fontWeight: "600" }}>{t("backendContent.selectedText")}</ThemedText>

              <View style={{ flexDirection: "row", gap: 4 }}>
                <ActionButton
                  icon="edit"
                  iconSize={18}
                  tooltip={t("backendContent.selectTextFirst")}
                  variant="secondary"
                  disabled
                  onPress={() => {}}
                />
                <ActionButton
                  icon="arrow-up"
                  iconSize={18}
                  tooltip={t("backendContent.selectTextFirst")}
                  variant="secondary"
                  disabled
                  onPress={() => {}}
                />
                <ActionButton
                  icon="arrow-down"
                  iconSize={18}
                  tooltip={t("backendContent.selectTextFirst")}
                  variant="secondary"
                  disabled
                  onPress={() => {}}
                />
                <ActionButton
                  icon="delete"
                  iconSize={18}
                  tooltip={t("backendContent.selectTextFirst")}
                  variant="secondary"
                  disabled
                  onPress={() => {}}
                />
              </View>
            </View>

            <ThemedText>{t("backendContent.selectTextHint")}</ThemedText>
          </View>
        )}

        {!loading && ready && displayedBlocks.map((block, index) => {
          const key = String(block.backendContentId);

          if (
            desktopEditorMode &&
            block.backendContentId !== selectedBlockId
          ) {
            return null;
          }

          if (block.kind !== "text") {
            return (
              <View key={key} style={{ gap: 8 }}>
                <ThemedText>
                  {t("backendContent.contentId", { id: block.backendContentId })}:{" "}
                  {t("backendContent.unsupportedType")}
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
                  accessibilityLabel={t(expanded ? "backendContent.closeText" : "backendContent.openText", { id: block.backendContentId })}
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
                    {desktopEditorMode ? t("backendContent.selectedText") : t("backendContent.textContent", { id: block.backendContentId })}
                  </ThemedText>
                  <ThemedText>
                    {!block.editable ? t("backendContent.locked") + "  " : ""}
                    {!desktopEditorMode && (expanded ? "▲" : "▼")}
                  </ThemedText>
                </Pressable>
                {desktopEditorMode && (
                  <ActionButton
                    icon="edit"
                    iconSize={18}
                    tooltip={t("backendContent.editSelectedText")}
                    variant="secondary"
                    disabled={!block.editable || !isHtml}
                    onPress={() =>
                      setDesktopEditRequest(previous => ({
                        elementId: block.backendContentId,
                        version: (previous?.version ?? 0) + 1,
                      }))
                    }
                  />
                )}
                {renderMoveActions(block.backendContentId, index, true)}

                {canMove &&
                 (desktopEditorMode || block.editable) &&
                 !removing &&
                 !moving && (
                  <ActionButton
                    icon="delete"
                    iconSize={18}
                    tooltip={!block.editable
                       ? t("backendContent.removeLocked")
                       : t("backendContent.remove")}
                    disabled={desktopEditorMode && (!block.editable || hasLocalReorder)}
                    variant="secondary"
                    onPress={() => requestRemoval(block.backendContentId)}
                  />
                )}
                </View>
              ) : (
                !desktopSelectionEnabled && (
                  <ThemedText style={{ fontWeight: "600" }}>
                    {t("backendContent.textContent", { id: block.backendContentId })}
                  </ThemedText>
                )
              )}

              {!editorMode && (
                <Pressable
                  disabled={!desktopSelectionEnabled}
                  accessibilityRole="button"
                  accessibilityLabel={t("backendContent.selectText", { id: block.backendContentId })}
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
                      desktopEditRequest={
                        desktopEditRequest?.elementId === block.backendContentId
                          ? desktopEditRequest.version
                          : 0
                      }
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
                        ? t("backendContent.notEditable")
                        : t("backendContent.notHtml")}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          );
        })}
        {!editorMode && !loading && ready && liveNewHtml !== null && (
          <View style={{ gap: 10 }}>
            <ThemedText style={{ fontWeight: "600" }}>{t("backendContent.newDraftPreview")}</ThemedText>
            <ContentTextBlockViewer html={liveNewHtml} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}