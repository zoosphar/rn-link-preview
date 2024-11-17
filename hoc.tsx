import React from "react";
import { LinkPreviewProvider } from "./context";

export function withLinkPreview<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options = { cacheSize: 100 }
) {
  return function WithLinkPreviewComponent(props: P) {
    return (
      <LinkPreviewProvider
        cacheSize={options.cacheSize}
        children={<WrappedComponent {...props} />}
      />
    );
  };
}
