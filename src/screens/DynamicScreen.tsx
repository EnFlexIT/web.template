import { useState, ReactNode, useEffect } from "react"
import { MenuItem } from "../redux/slices/menuSlice"
import { SiteContentList } from "../components/dynamic/content/SiteContentList"
import { useAppSelector } from "../hooks/useAppSelector"
import { selectApi } from "../redux/slices/apiSlice"
import { LoadingScreen } from "./LoadingScreen"
import { Screen } from "../components/Screen"

interface DynamicScreenProps {
    node: MenuItem
}
export function DynamicScreen({ node }: DynamicScreenProps) {
    const { dynamic_content_api } = useAppSelector(selectApi)
    const [isLoading, setIsLoading] = useState(true)

    const [element, setElement] = useState<ReactNode>(undefined)

    useEffect(() => {
        async function f() {
            /**
             * VERY IMPORTANT: for the time being we reverse the sign of the menuID because christian is sending content
             * with ids -1, -2, etc.. but the actual menuids are 1,2,...
             */
            const content = await dynamic_content_api.defaultApi.contentMenuIDGet(-node.menuID!)
            setElement(<SiteContentList siteContentList={content.data} />)
        }
        f()
    }, [])

    return element ? <Screen>{element}</Screen> : <LoadingScreen />

}
