import { AbstractSiteContent, SiteContentText, SiteContentImage, SiteContentProperties } from "../api/implementation/Dynamic-Content-Api";


export function isSiteContentText(content: AbstractSiteContent): content is SiteContentText {
    return (content as any).AbstractSiteContentType === "SiteContentText"
}

export function isSiteContentImage(content: AbstractSiteContent): content is SiteContentImage {
    return (content as any).AbstractSiteContentType === "SiteContentImage"
}

export function isSiteContentProperties(content: AbstractSiteContent): content is SiteContentProperties {
    return (content as any).AbstractSiteContentType === "SiteContentProperties"
}
