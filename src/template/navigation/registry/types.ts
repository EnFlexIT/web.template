import type {ComponentType} from "react";

export type RegisteredScreen =
  ComponentType<any>;

export type ScreenRegistry =
  Readonly<
    Record<
      string,
      RegisteredScreen
    >
  >;