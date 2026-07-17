import AntDesign from "@expo/vector-icons/AntDesign";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof AntDesign>["name"];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({
  name,
  size = 24,
  color = "black",
}: IconProps) {
  return (
    <AntDesign
      name={name}
      size={size}
      color={color}
    />
  );
}
