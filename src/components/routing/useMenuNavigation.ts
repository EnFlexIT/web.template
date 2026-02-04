// src/components/routing/useMenuNavigation.ts
import { useMemo } from "react";
import { useLinkTo } from "@react-navigation/native";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectMenu, setActiveMenuId } from "../../redux/slices/menuSlice";
import { buildMenuPaths } from "./menuPaths";

export function useMenuNavigation() {
  const linkTo = useLinkTo();
  const dispatch = useAppDispatch();
  const { rawMenu } = useAppSelector(selectMenu);

  const { pathById } = useMemo(() => buildMenuPaths(rawMenu), [rawMenu]);

  const goTo = (menuId: number) => {
    const path = pathById[menuId] ?? `/${menuId}`;

    //  Breadcrumb + Sidebar Sync
    dispatch(setActiveMenuId(menuId));

    // Slug Navigation
    linkTo(path);
  };

  return { goTo, pathById };
}
