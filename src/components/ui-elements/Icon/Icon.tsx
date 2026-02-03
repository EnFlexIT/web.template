import AntDesign from "@expo/vector-icons/AntDesign";

export type IconName =
  | "upload"
  | "close"
  | "check"
  | "delete"
  | "edit"
  | "setting"
  | "save"
  | "plus"
  | "trash"
  | "arrowright"
  | "arrowleft"
  | "search1"
  | "user"
  | "lock"
  | "logout"
  | "login"
  | "home"
  | "menuunfold"
  | "menufold"
  | "eye"
  | "eyeo"
  | "download"
  | "questioncircleo"
  | "infocirlceo"
  | "exclamationcircleo"  
  | "calendar"
  | "filetext1"
  | "folder1"
  | "copy1"
  | "link"
  | "unlink"
  | "tags"
  | "tag"
  | "filter"
  | "pushpino"
  | "pushpinoo"
  | "customerservice"
  | "phone"
  | "mail"
  | "picture"
  | "camera"
  | "cloudupload"
  | "clouddownload"
  | "star"
  | "staro"
  | "heart"
  | "hearto"
  | "smileo"
  | "smileo"
  | "frown"
  | "frowno"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "chevron-right"
  | "chevron-left"
  | "arrowdown"
  | "arrowup"
  | "minuscircleo"
  | "pluscircleo"
  | "notafound"
  | "not-interested";


   

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
