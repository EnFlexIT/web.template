import React, { useState } from "react";
import { BackendMenuCreateDialogV2 } from "./BackendMenuCreateDialogV2";
import { useTranslation } from "react-i18next";
import {
  planBackendMenuDeletionV2,
  type BackendMenuDeletionPlan,
} from "../adapters/planBackendMenuDeletionV2";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { useStore } from "react-redux";
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";

import {
  Dropdown,
} from "@/template/components/design-system/ui-elements/Dropdown";

import {
  BaseModal,
} from "@/template/components/design-system/ui-elements/BaseModal";

import {
  TextInput,
} from "@/template/components/design-system/ui-elements/TextInput";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  initializeMenu,
} from "@/template/state/navigation/menuSlice";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectCanEditInUiPreview,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

import {
  renameBackendMenuV2,
} from "../adapters/renameBackendMenuV2";
import {
  reorderBackendMenuV2,
} from "../adapters/reorderBackendMenuV2";

import {
  moveBackendMenuV2,
} from "../adapters/moveBackendMenuV2";

import {
  planBackendMenuMoveV2,
} from "../adapters/planBackendMenuMoveV2";

import {
  planBackendMenuReorderV2,
} from "../adapters/planBackendMenuReorderV2";

import {
  useRef as useMenuReorderRef,
} from "react";

export interface BackendMenuContextActionsV2Props {
  menuId: number;
  canAddSubmenu?: boolean;
}

export function BackendMenuContextActionsV2({
  menuId,
  canAddSubmenu = false,
}: BackendMenuContextActionsV2Props) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useAppDispatch();
  const store = useStore();

  const language = useAppSelector(
    state => state.language.language,
  );

  const allowed = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      state.backendRoles.status === "ready" &&
      selectCanEditInUiPreview(state) &&
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.trim().length > 0
    );
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletePlan, setDeletePlan] =
    useState<BackendMenuDeletionPlan | null>(null);

  const { t } = useTranslation(["Editor"]);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [moveSnapshot, setMoveSnapshot] = useState<{
    parentId: number | null;
    originalPosition: number;
    sourceMenuId: number;
    targets: Array<{
      menuId: number;
      caption: string;
    }>;
    siblings: Array<{
      menuId: number;
      caption: string;
      position: number;
    }>;
    context: ReturnType<typeof getRenameContext>;
    language: string;
  } | null>(null);

  const [movePosition, setMovePosition] = useState<number>(1);

  const [moveMode, setMoveMode] = useState<
    "reorder" | "parent"
  >("reorder");

  const [moveTargetId, setMoveTargetId] =
    useState<number | null>(null);

  const moveActionLock = useMenuReorderRef(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createParentCaption, setCreateParentCaption] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  function getState(): TemplateRootState {
    return store.getState() as TemplateRootState;
  }

  function getRenameContext() {
    const state = getState();
    const context = selectBackendContentWriteContext(state);

    return {
      ...context,
      client: state.api.dynamic_content_api_v2.defaultApi,
    };
  }

  async function openCreateDialog() {
    setCreateOpen(true);
    setCreateParentCaption("");

    try {
      const before = { ...getRenameContext() };

      if (
        !before.isLoggedIn ||
        !before.canEdit ||
        before.isLoggingOut ||
        before.isSwitchingServer
      ) {
        throw new Error("Editing is not permitted");
      }

      const response = await before.client.getMenus(language);

      const after = getRenameContext();

      if (
        after.client !== before.client ||
        after.server !== before.server ||
        after.authGeneration !== before.authGeneration ||
        !after.isLoggedIn ||
        !after.canEdit ||
        after.isLoggingOut ||
        after.isSwitchingServer
      ) {
        throw new Error("Session changed");
      }

      const items = response.data?.menuList;

      if (!Array.isArray(items)) {
        throw new Error("Menu list unavailable");
      }

      const matches = items.filter(item => item.menuId === menuId);

      if (
        matches.length !== 1 ||
        typeof matches[0].caption !== "string"
      ) {
        throw new Error("Parent menu not found");
      }

      setCreateParentCaption(matches[0].caption);
    } catch {
      setCreateParentCaption(t("create.loadError"));
    }
  }

  async function openRenameDialog() {
    setRenameTitle("");
    setRenameError("");
    setRenameOpen(true);
    setRenameLoading(true);

    try {
      const before = { ...getRenameContext() };

      if (
        !before.isLoggedIn ||
        !before.canEdit ||
        before.isLoggingOut ||
        before.isSwitchingServer
      ) {
        throw new Error(t("menuErrors.permissionDenied"));
      }

      const response = await before.client.getMenus(language);

      const after = getRenameContext();

      if (
        after.client !== before.client ||
        after.server !== before.server ||
        after.authGeneration !== before.authGeneration ||
        !after.isLoggedIn ||
        after.isLoggingOut ||
        after.isSwitchingServer
      ) {
        throw new Error(t("menuErrors.sessionChanged"));
      }

      const items = response.data?.menuList;

      if (!Array.isArray(items)) {
        throw new Error(t("menuErrors.menuListUnavailable"));
      }

      const matches = items.filter(item => item.menuId === menuId);

      if (matches.length !== 1) {
        throw new Error(t("menuErrors.menuNotUnique"));
      }

      setRenameTitle(matches[0].caption);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : t("menuErrors.menuLoadFailed"),
      );
    } finally {
      setRenameLoading(false);
    }
  }

  async function openDeleteDialog() {
    setDeleteOpen(true);
    setDeleteLoading(true);
    setDeleteError("");
    setDeletePlan(null);

    try {
      const before = { ...getRenameContext() };

      if (
        !before.isLoggedIn ||
        !before.canEdit ||
        before.isLoggingOut ||
        before.isSwitchingServer
      ) {
        throw new Error("Editing is not permitted");
      }

      const response = await before.client.getMenus(language);

      const after = getRenameContext();

      if (
        after.client !== before.client ||
        after.server !== before.server ||
        after.authGeneration !== before.authGeneration ||
        !after.isLoggedIn ||
        !after.canEdit ||
        after.isLoggingOut ||
        after.isSwitchingServer
      ) {
        throw new Error("Session changed");
      }

      const items = response.data?.menuList;

      if (!Array.isArray(items)) {
        throw new Error("Menu list unavailable");
      }

      const menus = items.map(item => {
        if (
          typeof item.menuId !== "number" ||
          typeof item.caption !== "string"
        ) {
          throw new Error("Invalid menu data");
        }

        return {
          menuId: item.menuId,
          parentId: item.parentId,
          caption: item.caption,
        };
      });

      const plan = planBackendMenuDeletionV2(menus, menuId);

      setDeletePlan(plan);
    } catch {
      setDeleteError(t("delete.loadError"));
    } finally {
      setDeleteLoading(false);
    }
  }

  function isCurrentMoveSession(
    before: ReturnType<typeof getRenameContext>,
  ): boolean {
    const current = getRenameContext();

    return (
      before.client === current.client &&
      before.server === current.server &&
      before.authGeneration === current.authGeneration &&
      current.isLoggedIn &&
      current.canEdit &&
      !current.isLoggingOut &&
      !current.isSwitchingServer
    );
  }

  async function openMoveDialog() {
    if (moveActionLock.current) return;

    moveActionLock.current = true;

    setMoveError("");
    setMoveSnapshot(null);
    setMovePosition(1);
    setMoveMode("reorder");
    setMoveTargetId(null);
    setMoveOpen(true);
    setMoveLoading(true);

    try {
      const before = { ...getRenameContext() };

      if (!isCurrentMoveSession(before)) {
        throw new Error(t("menuErrors.permissionDenied"));
      }

      const response = await before.client.getMenus(language);

      if (!isCurrentMoveSession(before)) {
        throw new Error("Menu session changed. Please reopen the dialog.");
      }

      const items = response.data?.menuList;

      if (!Array.isArray(items)) {
        throw new Error(t("menuErrors.moveTargetsUnavailable"));
      }

      const source = items.find(item => item.menuId === menuId);

      if (!source) {
        throw new Error("Backend menu not found.");
      }

      console.log("[MENU-REORDER-DEBUG]", {
        selectedMenuId: menuId,
        selectedParentId: source.parentId ?? null,
        siblings: items
          .filter(item =>
            (item.parentId ?? null) ===
            (source.parentId ?? null)
          )
          .map(item => ({
            menuId: item.menuId,
            parentId: item.parentId,
            caption: item.caption,
            position: item.position,
            isHeadMenu: item.isHeadMenu,
          })),
        totalMenus: items.length,
      });

      console.table(
        items.map(item => ({
          menuId: item.menuId,
          parentId: item.parentId ?? null,
          caption: item.caption,
          position: item.position,
          isHeadMenu: item.isHeadMenu,
        }))
      );

// Validate the current hierarchy and position inventory.
      planBackendMenuReorderV2({
        items,
        menuId,
        targetPosition: source.position,
      });

      const parentId = source.parentId ?? null;

      const siblings = items
        .filter(item => (item.parentId ?? null) === parentId)
        .sort((a, b) => a.position - b.position)
        .map(item => ({
          menuId: item.menuId,
          caption: item.caption,
          position: item.position,
        }));

      const existingParentIds = new Set(
        items
          .map(item => item.parentId)
          .filter(
            (id): id is number =>
              typeof id === "number" && id > 0,
          ),
      );

      const candidateIds = items
        .filter(item =>
          !source.isHeadMenu &&
          existingParentIds.has(item.menuId) &&
          item.menuId !== menuId &&
          item.menuId !== parentId,
        )
        .map(item => item.menuId);

      const targets = items
        .filter(candidate => {
          if (!candidateIds.includes(candidate.menuId)) {
            return false;
          }

          try {
            planBackendMenuMoveV2({
              items,
              menuId,
              targetParentId: candidate.menuId,
              allowedParentIds: candidateIds,
            });

            return true;
          } catch {
            return false;
          }
        })
        .map(item => ({
          menuId: item.menuId,
          caption: item.pathCaption || item.caption,
        }));

      setMoveSnapshot({
        parentId,
        originalPosition: source.position,
        sourceMenuId: menuId,
        targets,
        siblings,
        context: before,
        language,
      });

      setMovePosition(source.position);
    } catch (error) {
      setMoveError(
        error instanceof Error
          ? error.message
          : t("menuErrors.moveTargetsUnavailable"),
      );
    } finally {
      setMoveLoading(false);
      moveActionLock.current = false;
    }
  }

  async function saveMove() {
    if (
      moveActionLock.current ||
      moveBusy ||
      moveLoading ||
      !moveSnapshot ||
      moveSnapshot.sourceMenuId !== menuId ||
      (
        moveMode === "reorder"
          ? movePosition === moveSnapshot.originalPosition
          : !moveSnapshot.targets.some(
              target => target.menuId === moveTargetId,
            )
      )
    ) return;

    moveActionLock.current = true;

    setMoveBusy(true);
    setMoveError("");

    try {
      if (
        !isCurrentMoveSession(moveSnapshot.context) ||
        moveSnapshot.language !== language
      ) {
        throw new Error("Menu session changed. Please reopen the dialog.");
      }

      if (moveMode === "parent") {
        if (
          moveTargetId === null ||
          !moveSnapshot.targets.some(
            target => target.menuId === moveTargetId,
          )
        ) {
          throw new Error("Invalid target menu.");
        }

        await moveBackendMenuV2({
          menuId,
          targetParentId: moveTargetId,
          expectedParentId: moveSnapshot.parentId,
          allowedParentIds: moveSnapshot.targets.map(
            target => target.menuId,
          ),
          language,
          getContext: getRenameContext,
        });
      } else {
        await reorderBackendMenuV2({
          menuId,
          targetPosition: movePosition,
          expectedParentId: moveSnapshot.parentId,
          expectedSiblingIds: moveSnapshot.siblings.map(
            item => item.menuId,
          ),
          language,
          getContext: getRenameContext,
        });
      }

      if (!isCurrentMoveSession(moveSnapshot.context)) {
        throw new Error("Menu session changed after saving.");
      }

      setMoveSnapshot(null);

      await dispatch(initializeMenu()).unwrap();

      setMoveOpen(false);
    } catch (error) {
      // Prevent retrying a potentially already committed update.
      setMoveSnapshot(null);

      let message =
        error instanceof Error
          ? error.message
          : t("menuErrors.moveFailed");

      // Reload only while the original session is still valid.
      if (
        isCurrentMoveSession(moveSnapshot.context) &&
        moveSnapshot.language === language
      ) {
        try {
          await dispatch(initializeMenu()).unwrap();
        } catch {
          message += language.toLowerCase().startsWith("de")
            ? " Menues konnten nicht neu geladen werden."
            : " Unable to reload menus.";
        }
      }

      setMoveError(message);
    } finally {
      setMoveBusy(false);
      moveActionLock.current = false;
    }
  }

  const movePreview = (() => {
    if (!moveSnapshot) return [];

    const selected = moveSnapshot.siblings.find(
      item => item.menuId === menuId,
    );

    if (!selected) return [];

    const ordered = moveSnapshot.siblings.filter(
      item => item.menuId !== menuId,
    );

    ordered.splice(movePosition - 1, 0, selected);

    return ordered;
  })();

  const moveDisabled =
    moveBusy ||
    moveLoading ||
    !moveSnapshot ||
    moveSnapshot.sourceMenuId !== menuId ||
    (
      moveMode === "reorder"
        ? movePosition === moveSnapshot.originalPosition
        : !moveSnapshot.targets.some(
            target => target.menuId === moveTargetId,
          )
    );

  const moveIsGerman = language.toLowerCase().startsWith("de");

  async function saveRename() {
    if (renameBusy || renameLoading) return;

    setRenameBusy(true);
    setRenameError("");

    try {
      await renameBackendMenuV2({
        menuId,
        caption: renameTitle,
        language,
        getContext: getRenameContext,
      });

      await dispatch(initializeMenu()).unwrap();

      setRenameOpen(false);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : t("menuErrors.renameFailed"),
      );
    } finally {
      setRenameBusy(false);
    }
  }

  if (!allowed || !Number.isSafeInteger(menuId) || menuId <= 0) {
    return null;
  }

  return (
    <>
      <Dropdown<string>
        disabledOptions={canAddSubmenu ? [] : ["create"]}
        value="open"
        options={{
          open: t("menuActions.open"),
          rename: t("menuActions.rename"),
          move: t("menuActions.move"),
          create: t("create.action"),
          delete: t("delete.action"),
        }}
        optionIcons={{
          open: "edit-2",
          rename: "edit-2",
          move: "folder",
          create: "folder-plus",
          delete: "trash-2",
        }}
        triggerLabel="⋯"
        minimalMenu
        menuPlacement="auto"
        triggerWidth={32}
        hideChevron
        appearance="menu"
        menuWidth={220}
        size="sm"
        onChange={action => {
          if (action === "open") {
            navigation.navigate("3027", {
              backendMenuId: menuId,
            });
          }

          if (action === "rename") {
            void openRenameDialog();
          }

          if (action === "move") {
            void openMoveDialog();
          }

          if (action === "create" && canAddSubmenu) {
            void openCreateDialog();
          }

          if (action === "delete") {
            void openDeleteDialog();
          }
        }}
      />

      <BackendMenuCreateDialogV2
        visible={createOpen}
        parentId={menuId}
        parentCaption={createParentCaption}
        onClose={() => setCreateOpen(false)}
      />
      <BaseModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 19, fontWeight: "600" }}>
            {t("delete.title")}
          </Text>

          {deleteLoading && (
            <Text>{t("delete.loading")}</Text>
          )}

          {deleteError !== "" && (
            <Text style={{ color: "#b42318" }}>
              {deleteError}
            </Text>
          )}

          {!deleteLoading && deletePlan !== null && (
            <>
              <Text>
                {t("delete.warning", {
                  name: deletePlan.caption,
                })}
              </Text>

              <Text>
                {t("delete.submenus", {
                  count: deletePlan.descendantCount,
                })}
              </Text>

              <Text style={{ color: "#b42318" }}>
                {t("delete.contentWarning")}
              </Text>

              <Text>{t("delete.disabled")}</Text>
            </>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => setDeleteOpen(false)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text>{t("delete.cancel")}</Text>
            </Pressable>

            <Pressable
              disabled
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "#b42318",
                opacity: 0.4,
              }}
            >
              <Text style={{ color: "#ffffff" }}>
                {t("delete.confirm", {
                  count: deletePlan?.totalCount ?? 0,
                })}
              </Text>
            </Pressable>
          </View>
        </View>
      </BaseModal>
      <BaseModal
        visible={moveOpen}
        onClose={() => {
          if (!moveActionLock.current) setMoveOpen(false);
        }}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 19, fontWeight: "600" }}>
            {t("menuActions.moveTitle")}
          </Text>

          {moveSnapshot && (
            <View style={{
              flexDirection: "row",
              gap: 8,
            }}>
              {(["reorder", "parent"] as const).map(mode => (
                <Pressable
                  key={mode}
                  disabled={moveBusy || moveLoading}
                  onPress={() => setMoveMode(mode)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderColor: moveMode === mode
                      ? "#2463eb"
                      : "#cccccc",
                    backgroundColor: moveMode === mode
                      ? "#2463eb18"
                      : "transparent",
                  }}
                >
                  <Text style={{ textAlign: "center" }}>
                    {mode === "reorder"
                      ? (moveIsGerman
                          ? "Reihenfolge"
                          : "Reorder")
                      : (moveIsGerman
                          ? "In Menue verschieben"
                          : "Move to menu")}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {moveMode === "reorder" && (
          <Text>
            {t("menuActions.reorderDescription", {
              defaultValue: moveIsGerman
                ? "Reihenfolge im aktuellen Ordner bearbeiten"
                : "Change the order within the current folder",
            })}
          </Text>
          )}

          {moveLoading && (
            <Text>{t("menuActions.moveLoading")}</Text>
          )}

          {moveSnapshot && moveMode === "reorder" && (
            <>
              <Text>
                {t("menuActions.position", {
                  defaultValue: "Position",
                })}
                {": "}
                {movePosition} / {moveSnapshot.siblings.length}
              </Text>

              {movePreview.map((item, index) => (
                <View
                  key={item.menuId}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: item.menuId === menuId
                      ? "#2463eb"
                      : "#cccccc",
                    backgroundColor: item.menuId === menuId
                      ? "#2463eb18"
                      : "transparent",
                    borderRadius: 6,
                  }}
                >
                  <Text style={{
                    fontWeight: item.menuId === menuId
                      ? "600"
                      : "400",
                  }}>
                    {index + 1}. {item.caption}
                    {item.menuId === menuId ? " \u2713" : ""}
                  </Text>
                </View>
              ))}

              <View style={{
                flexDirection: "row",
                gap: 12,
              }}>
                <Pressable
                  disabled={moveBusy || movePosition <= 1}
                  onPress={() => setMovePosition(
                    value => Math.max(1, value - 1),
                  )}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#cccccc",
                    borderRadius: 6,
                    opacity:
                      moveBusy || movePosition <= 1 ? 0.4 : 1,
                  }}
                >
                  <Text style={{ textAlign: "center" }}>
                    {t("menuActions.moveUp", {
                      defaultValue: moveIsGerman
                        ? "Nach oben"
                        : "Move up",
                    })}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={
                    moveBusy ||
                    movePosition >= moveSnapshot.siblings.length
                  }
                  onPress={() => setMovePosition(
                    value => Math.min(
                      moveSnapshot.siblings.length,
                      value + 1,
                    ),
                  )}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#cccccc",
                    borderRadius: 6,
                    opacity:
                      moveBusy ||
                      movePosition >= moveSnapshot.siblings.length
                        ? 0.4 : 1,
                  }}
                >
                  <Text style={{ textAlign: "center" }}>
                    {t("menuActions.moveDown", {
                      defaultValue: moveIsGerman
                        ? "Nach unten"
                        : "Move down",
                    })}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                disabled={moveBusy}
                onPress={() => setMovePosition(
                  moveSnapshot.originalPosition,
                )}
              >
                <Text>
                  {t("menuActions.resetOrder", {
                    defaultValue: moveIsGerman
                      ? "Zuruecksetzen"
                      : "Reset",
                  })}
                </Text>
              </Pressable>
            </>
          )}

          {moveSnapshot && moveMode === "parent" && (
            <View style={{ gap: 10 }}>
              <Text>{t("menuActions.moveParent")}</Text>

              {moveSnapshot.targets.length === 0 && (
                <Text>{t("menuActions.moveEmpty")}</Text>
              )}

              {moveSnapshot.targets.map(target => (
                <Pressable
                  key={target.menuId}
                  disabled={moveBusy || moveLoading}
                  onPress={() => setMoveTargetId(target.menuId)}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderColor:
                      moveTargetId === target.menuId
                        ? "#2463eb"
                        : "#cccccc",
                    backgroundColor:
                      moveTargetId === target.menuId
                        ? "#2463eb18"
                        : "transparent",
                  }}
                >
                  <Text>
                    {moveTargetId === target.menuId
                      ? "\u2713 "
                      : ""}
                    {target.caption}
                  </Text>
                </Pressable>
              ))}

              {moveTargetId !== null && (
                <Text>
                  {moveIsGerman
                    ? "Das Menue wird am Ende des Zielordners eingefuegt."
                    : "The menu will be appended to the target folder."}
                </Text>
              )}
            </View>
          )}

          {moveError !== "" && (
            <Text style={{ color: "#b42318" }}>
              {moveError}
            </Text>
          )}

          <View style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 12,
          }}>
            <Pressable
              disabled={moveBusy || moveLoading}
              onPress={() => setMoveOpen(false)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text>{t("menuActions.cancel")}</Text>
            </Pressable>

            <Pressable
              disabled={moveDisabled}
              onPress={() => void saveMove()}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "#2463eb",
                borderRadius: 6,
                opacity: moveDisabled ? 0.4 : 1,
              }}
            >
              <Text style={{ color: "#ffffff" }}>
                {moveBusy
                  ? t("menuActions.savingOrder", {
                      defaultValue: moveIsGerman
                        ? "Speichern..."
                        : "Saving...",
                    })
                  : moveMode === "parent"
                    ? t("menuActions.move")
                    : t("menuActions.saveOrder", {
                      defaultValue: moveIsGerman
                        ? "Speichern"
                        : "Save order",
                    })}
              </Text>
            </Pressable>
          </View>
        </View>
      </BaseModal>
      <BaseModal
        visible={renameOpen}
        onClose={() => {
          if (!renameBusy) setRenameOpen(false);
        }}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 19, fontWeight: "600" }}>
            {t("menuActions.renameTitle")}
          </Text>

          <TextInput
            label={t("menuActions.renameLabel")}
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder={t("menuActions.renamePlaceholder")}
          />

          {renameLoading && (
            <Text>{t("menuActions.renameLoading")}</Text>
          )}

          {renameError !== "" && (
            <Text style={{ color: "#b42318" }}>
              {renameError}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => setRenameOpen(false)}
              disabled={renameBusy}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text>{t("menuActions.cancel")}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void saveRename();
              }}
              disabled={
                renameBusy ||
                renameLoading ||
                !renameTitle.trim() ||
                renameError !== ""
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "#2463eb",
                opacity:
                  renameBusy ||
                  renameLoading ||
                  !renameTitle.trim()
                    ? 0.5
                    : 1,
              }}
            >
              <Text style={{ color: "#ffffff" }}>
                {renameBusy ? t("menuErrors.saving") : t("menuErrors.save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </BaseModal>
    </>
  );
}