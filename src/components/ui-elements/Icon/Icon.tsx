import AntDesign from "@expo/vector-icons/AntDesign";

export type IconName =
  | "upload"
  | "close"
  | "check"
  | "delete"
  | "edit";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({
  name,
  size = 24,
  color = "black",
}: IconProps) {
  return <AntDesign name={name} size={size} color={color} />;
}
