import { Level } from "@tiptap/extension-heading";
import { SvgProps } from "react-native-svg";

import { H1_Icon } from "./H1Icon";
import { H2_Icon } from "./H2Icon";
import { H3_Icon } from "./H3Icon";
import { H4_Icon } from "./H4Icon";
import { H5_Icon } from "./H5Icon";
import { H6_Icon } from "./H6Icon";

interface HeadingIconProps extends SvgProps {
    level: Level
}

export function HeadingIcon({ level, ...rest }: HeadingIconProps) {
    switch (level) {
        case 1:
            return <H1_Icon {...rest} />
        case 2:
            return <H2_Icon {...rest} />
        case 3:
            return <H3_Icon {...rest} />
        case 4:
            return <H4_Icon {...rest} />
        case 5:
            return <H5_Icon {...rest} />
        case 6:
            return <H6_Icon {...rest} />
    }
}
