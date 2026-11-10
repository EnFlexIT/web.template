import { Text } from "@/template/components/design-system/stylistic/Text";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import { formatBackendRoles } from "@/template/state/authorization/formatBackendRoles";

/**
 * Read-only display of roles returned by the backend.
 * The separate role preview remains a development feature.
 */
export function BackendRolesDisplay() {
  const status = useAppSelector(
    (state) => state.backendRoles.status,
  );

  const roles = useAppSelector(
    (state) => state.backendRoles.roles,
  );

  return (
    <Text numberOfLines={1}>
      {formatBackendRoles(status, roles)}
    </Text>
  );
}
