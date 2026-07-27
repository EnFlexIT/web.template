import { ReactNode, useEffect, useState } from "react";
import { Text } from "../../components/stylistic/Text";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";
import { SiteContentList } from "../../components/dynamic/content/SiteContentList";

export function DynamicTextScreen() {
    const { dynamic_content_api } = useAppSelector(selectApi)

    const [node, setNode] = useState<ReactNode>(undefined);

    useEffect(function () {
        async function f() {
            const { data } = await dynamic_content_api.defaultApi.contentMenuIDGet(-1);
            setNode(<SiteContentList siteContentList={data} />)
        }
        f()
    }, [])
    return node
}
