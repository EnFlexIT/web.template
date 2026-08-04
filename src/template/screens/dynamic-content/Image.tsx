import { ReactNode, useEffect, useState } from "react";
import { Text } from "@/template/components/design-system/stylistic/Text";
import { useAppSelector } from "@/core/hooks/useAppSelector";
import { selectApi } from "@/template/state/api/apiSlice";
import { SiteContentList } from "@/template/components/dynamic-content/content/SiteContentList";

export function DynamicImageScreen() {
    const { dynamic_content_api } = useAppSelector(selectApi)

    const [node, setNode] = useState<ReactNode>(undefined);

    useEffect(function () {
        async function f() {
            const { data } = await dynamic_content_api.defaultApi.contentMenuIDGet(-2);
            setNode(<SiteContentList siteContentList={data} />)
        }
        f()
    }, [])
    return node
}
