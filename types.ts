export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: {
    url?: string;
  };
}

export interface LinkPreviewContextType {
  getMetadataForUrl: (url: string) => Promise<LinkMetadata | null>;
  cachedMetadata: Record<string, LinkMetadata>;
}