import type {
  ComponentType,
  ReactNode,
} from "react";

import type {
  EffectiveUserRole,
} from "@/template/authorization/roles";

export type TabContent =
  | ComponentType<any>
  | (() => ReactNode);

export type TabLayout =
  | "default"
  | "wide";

export type StaticTabItem = {
  menuID: number;
  tabKey: string;
  caption: string;
  position?: number;
  featureID?: number;
  roles?: readonly EffectiveUserRole[];
  layout?: TabLayout;
  Content: TabContent;
};