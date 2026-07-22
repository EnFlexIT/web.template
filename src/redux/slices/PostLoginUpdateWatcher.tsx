import { usePostLoginAutoReloadWeb } from "../../core/update/hooks/usePostLoginAutoReloadWeb";

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