// src/routing/useMenuNavigation.ts
import { useMemo } from "react";
import { useLinkTo } from "@react-navigation/native";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectMenu } from "../../redux/slices/menuSlice";
import { buildMenuPaths } from "./menuPaths";

export function useMenuNavigation() {
  const linkTo = useLinkTo();
  const { rawMenu } = useAppSelector(selectMenu);

  const { pathById } = useMemo(
    () => buildMenuPaths(rawMenu),
    [rawMenu]
  );

  const goTo = (menuID: number) => {
    const path = pathById[menuID];
    if (path) linkTo(path);
  };

  return { goTo, pathById };
}
