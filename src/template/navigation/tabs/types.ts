import type {
  ComponentType,
  ReactNode,
} from "react";

export type TabContent =
  | ComponentType<any>
  | (() => ReactNode);

export type StaticTabItem = {
  menuID: number;
  tabKey: string;
  caption: string;
  position?: number;
  featureID?: number;
  Content: TabContent;
};
