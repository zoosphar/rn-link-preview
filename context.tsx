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

  const getMetadataForUrl = React.useCallback(
    async (url: string) => {
      if (cache[url]) {
        return cache[url];
      }

      return new Promise<LinkMetadata | null>((resolve, reject) => {
        metadataPromiseRef.current = { resolve, reject };
        setCurrentUrl(url);

        // Add timeout to prevent infinite loop
        setTimeout(() => {
          if (metadataPromiseRef.current) {
            metadataPromiseRef.current.resolve(null);
            setCurrentUrl(null);
          }
        }, 10000);
      });
    },
    [cache]
  );

  return (
    <LinkPreviewContext.Provider
      value={{ getMetadataForUrl, cachedMetadata: cache }}
    >
      {currentUrl && (
        <View style={{ height: 0, width: 0, opacity: 0 }}>
          <WebView
            source={{ uri: currentUrl }}
            style={{ height: 0, width: 0, display: "none" }}
            onMessage={(event) =>
              handleMetadataReceived(JSON.parse(event.nativeEvent.data))
            }
            injectedJavaScript={`
              (function() {
                let retries = 0;
                const maxRetries = 4;
                const interval = setInterval(() => {
                  const metaTags = document.getElementsByTagName("meta");
                  const metaTagsObject = {};
                  Array.from(metaTags).forEach((tag) => {
                    metaTagsObject[
                      tag.getAttribute("property") || tag.getAttribute("name")
                    ] = tag.getAttribute("content");
                  });
                  if(Object.keys(metaTagsObject).length > 0) {
                    clearInterval(interval);
                    window.ReactNativeWebView.postMessage(JSON.stringify(metaTagsObject));
                  } else if(retries >= maxRetries) {
                    clearInterval(interval);
                    window.ReactNativeWebView.postMessage(JSON.stringify({}));
                  }
                  retries++;
                }, 500);
              })();
            `}
          />
        </View>
      )}
      {children}
    </LinkPreviewContext.Provider>
  );
}
