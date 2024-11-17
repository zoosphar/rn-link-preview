import { useState, useEffect } from 'react';
import { LinkMetadata } from './types';
import { useLinkPreviewContext } from './context';

export function useLinkPreview(text: string) {
  const [urlMetadata, setUrlMetadata] = useState<LinkMetadata | null>(null);
  const { getMetadataForUrl } = useLinkPreviewContext();

  useEffect(() => {
    const url = extractUrl(text);
    if (url) {
      getMetadataForUrl(url).then(metadata => {
        if (metadata) {
          setUrlMetadata(metadata);
        }
      });
    } else {
      setUrlMetadata(null);
    }
  }, [text, getMetadataForUrl]);

  return {
    urlMetadata,
    isLoading: urlMetadata === null && extractUrl(text) !== null
  };
}

function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex);
  if (!matches) return null;

  for (const match of matches) {
    try {
      const urlString = !match.startsWith("http") ? `https://${match}` : match;
      new URL(urlString);
      return urlString;
    } catch {
      continue;
    }
  }
  return null;
}