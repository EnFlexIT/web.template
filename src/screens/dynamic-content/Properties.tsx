import { ReactNode, useEffect, useState } from "react";
import { Text } from "../../components/stylistic/Text";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";
import { SiteContentList } from "../../components/dynamic/content/SiteContentList";

export function DynamicPropertiesScreen() {
    const { dynamic_content_api } = useAppSelector(selectApi)

    const [node, setNode] = useState<ReactNode>(undefined);

    useEffect(function () {
        async function f() {
            const { data } = await dynamic_content_api.defaultApi.contentMenuIDGet(-3);
            setNode(<SiteContentList siteContentList={data} />)
        }
        f()
    }, [])
    return node
}
