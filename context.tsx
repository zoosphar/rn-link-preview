import React, { createContext, useContext, ReactNode } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { LinkMetadata, LinkPreviewContextType } from "./types";

const LinkPreviewContext = createContext<LinkPreviewContextType | null>(null);

export function useLinkPreviewContext() {
  const context = useContext(LinkPreviewContext);
  if (!context) {
    throw new Error(
      "useLinkPreviewContext must be used within a LinkPreviewProvider"
    );
  }
  return context;
}

interface ProviderProps {
  children: ReactNode;
  cacheSize?: number;
}

export function LinkPreviewProvider({
  children,
  cacheSize = 100,
}: ProviderProps) {
  const [cache, setCache] = React.useState<Record<string, LinkMetadata>>({});
  const [currentUrl, setCurrentUrl] = React.useState<string | null>(null);
  const metadataPromiseRef = React.useRef<{
    resolve: (value: LinkMetadata | null) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const handleMetadataReceived = React.useCallback(
    (metadata: LinkMetadata) => {
      if (
        currentUrl &&
        (metadata.description || metadata.title || metadata.image?.url)
      ) {
        setCache((prev) => {
          const entries = Object.entries(prev);
          if (entries.length >= cacheSize) {
            // Remove oldest entry if cache is full
            const [oldestKey] = entries[0];
            const { [oldestKey]: _, ...rest } = prev;
            return { ...rest, [currentUrl]: metadata };
          }
          return { ...prev, [currentUrl]: metadata };
        });
        metadataPromiseRef.current?.resolve(metadata);
      } else {
        metadataPromiseRef.current?.resolve(null);
      }
      setCurrentUrl(null);
    },
    [currentUrl, cacheSize]
  );

  // ... rest of the provider implementation
}
