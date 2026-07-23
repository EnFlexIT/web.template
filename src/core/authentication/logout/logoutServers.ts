import {
  getJwtForServer,
  normalizeBaseUrl,
  setJwtForServer,
  type AuthMethod,
} from "../../../redux/slices/apiSlice";

export type LogoutServerSource = {
  id: string;
  name?: string | null;
  baseUrl: string;
};

export type LogoutServerItem = {
  id: string;
  name: string;
  baseUrl: string;
  normalizedBaseUrl: string;
  isCurrent: boolean;
  authenticationMethod: AuthMethod;
};

type GetLoggedInServersParams = {
  servers: LogoutServerSource[];
  currentIp: string;
  isLoggedIn: boolean;
  authenticationMethod: AuthMethod;
};

export type LogoutSelectedServersResult = {
  selectedCurrentServer?: LogoutServerItem;
  loggedOutOtherServers: LogoutServerItem[];
};

type LogoutSelectedServersParams = {
  loggedInServers: LogoutServerItem[];
  selectedServerIds: string[];
};

export async function getLoggedInServers({
  servers,
  currentIp,
  isLoggedIn,
  authenticationMethod,
}: GetLoggedInServersParams): Promise<LogoutServerItem[]> {
  const currentNormalizedIp = normalizeBaseUrl(currentIp);

  const currentServer = servers.find(
    (server) =>
      normalizeBaseUrl(server.baseUrl) === currentNormalizedIp,
  );

  const result: LogoutServerItem[] = [];

  if (isLoggedIn && currentNormalizedIp) {
    result.push({
      id: currentServer?.id ?? "local",
      name:
        currentServer?.name?.trim() ||
        currentServer?.baseUrl ||
        currentIp,
      baseUrl: currentServer?.baseUrl ?? currentIp,
      normalizedBaseUrl: currentNormalizedIp,
      isCurrent: true,
      authenticationMethod,
    });
  }

  const otherServers = await Promise.all(
    servers.map(
      async (
        server,
      ): Promise<LogoutServerItem | null> => {
        const normalizedBaseUrl = normalizeBaseUrl(
          server.baseUrl,
        );

        if (normalizedBaseUrl === currentNormalizedIp) {
          return null;
        }

        const jwt = await getJwtForServer(server.baseUrl);

        if (!jwt) {
          return null;
        }

        return {
          id: server.id,
          name: server.name?.trim() || server.baseUrl,
          baseUrl: server.baseUrl,
          normalizedBaseUrl,
          isCurrent: false,
          authenticationMethod: "jwt",
        };
      },
    ),
  );

  result.push(
    ...otherServers.filter(
      (
        server,
      ): server is LogoutServerItem => server !== null,
    ),
  );

  result.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;

    return a.name.localeCompare(b.name);
  });

  return result;
}

export async function logoutSelectedServers({
  loggedInServers,
  selectedServerIds,
}: LogoutSelectedServersParams): Promise<LogoutSelectedServersResult> {
  const selectedServers = loggedInServers.filter(
    (server) => selectedServerIds.includes(server.id),
  );

  const selectedCurrentServer = selectedServers.find(
    (server) => server.isCurrent,
  );

  const selectedOtherServers = selectedServers.filter(
    (server) => !server.isCurrent,
  );

  for (const server of selectedOtherServers) {
    await setJwtForServer(server.baseUrl, null);
  }

  return {
    selectedCurrentServer,
    loggedOutOtherServers: selectedOtherServers,
  };
}