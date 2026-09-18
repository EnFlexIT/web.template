import type {
  ComponentClass,
  FunctionComponent,
} from "react";

import type {
  IconName,
} from "@/template/components/design-system/ui-elements/Icon/Icon";

export type StaticMenuItem = {
  caption: string;
  menuID: number;
  parentID?: number;
  position?: number;
  icon?: IconName;
  Screen: ComponentClass<any> | FunctionComponent<any>;
};