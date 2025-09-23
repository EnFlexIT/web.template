import { SiteContentList as SiteContentListType } from "../../../api/implementation/Dynamic-Content-Api"
import { AbstractSiteContent } from "./AbstractSiteContent"

interface SiteContentProps {
    siteContentList: SiteContentListType
}
export function SiteContentList({ siteContentList: { contentList: data } }: SiteContentProps) {
    return (
        data.map((content, idx) => <AbstractSiteContent abstractSiteContent={content} key={idx} />)
    )
}
