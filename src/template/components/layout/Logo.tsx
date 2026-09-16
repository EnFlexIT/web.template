import {
  Image,
  type ImageProps,
  type ImageStyle,
} from "react-native";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

const defaultLogo =
  require("../../../../assets/awb1024.png");

export function Logo(
  props:
    Omit<
      ImageProps,
      "source" | "style"
    > & {
      style?: ImageStyle;
    },
) {
  const {
    branding,
  } =
    useApplicationConfig();

  const source =
    branding?.logo ??
    defaultLogo;

  return (
    <Image
      {...props}
      source={source}
    />
  );
}