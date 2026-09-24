import type {
  ComponentType,
  ReactNode,
} from "react";

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
  layout?: TabLayout;
  Content: TabContent;
};