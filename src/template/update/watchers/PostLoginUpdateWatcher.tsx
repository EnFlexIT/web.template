import { usePostLoginAutoReloadWeb } from "@/template/hooks/update/usePostLoginAutoReloadWeb";

type Props = {
  enabled: boolean;
};

export function PostLoginUpdateWatcher({
  enabled,
}: Props) {
  usePostLoginAutoReloadWeb({
    enabled,
  });

  return null;
}