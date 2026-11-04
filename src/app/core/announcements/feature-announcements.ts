export interface FeatureAnnouncement {
    id: string;
    key: string;
    title: string;
    body: string;
    linkLabel?: string;
    link?: string;
    queryParams?: Record<string, string> | null;
}
