import type {
  Configuration as LegacyDynamicContentConfiguration,
} from "@/api/implementation/Dynamic-Content-Api";

import {
  Configuration as DynamicContentV2Configuration,
  DefaultApi as DynamicContentV2Api,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export function createDynamicContentApiV2(
  legacyConfiguration: LegacyDynamicContentConfiguration,
): DynamicContentV2Api {
  const configuration = new DynamicContentV2Configuration({
    basePath: legacyConfiguration.basePath,
    baseOptions: legacyConfiguration.baseOptions,
  });

  return new DynamicContentV2Api(configuration);
}