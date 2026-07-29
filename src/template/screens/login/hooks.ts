import { useAppSelector } from "@/core/hooks/useAppSelector";
import { selectApi, selectAuthenticationMethod, selectIp } from "@/redux/slices/apiSlice";
import { selectLanguage } from "@/template/state/localization/languageSlice";
import { selectThemeInfo } from "@/template/state/theme/themeSlice";
import { selectServers } from "@/redux/slices/serverSlice";

export function useLoginState() {
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const api = useAppSelector(selectApi);
  const ip = useAppSelector(selectIp);

  const language = useAppSelector(selectLanguage);
  const themeState = useAppSelector(selectThemeInfo);

  const serversState = useAppSelector(selectServers);
  const servers = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const selectedBaseUrl = selectedServer?.baseUrl ?? ip;

  return {
    authenticationMethod,
    api,
    ip,
    language,
    themeState,
    servers,
    selectedServerId,
    selectedBaseUrl,
  };
}
