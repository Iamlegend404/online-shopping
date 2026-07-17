// hooks/useSandboxDetection.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the page is running inside a restrictive iframe sandbox
 * (e.g. missing allow-same-origin), which breaks things like document.domain
 * assignment and PDF plugin object embeds.
 *
 * Only runs the check when embedded in an iframe (window.self !== window.top).
 */
export function useSandboxDetection() {
  const [isSandboxed, setIsSandboxed] = useState(false);
  const [isLoading, setIsloading] = useState(true);
  useEffect(() => {
    if (window.self === window.top) return;
    setIsloading(true);
    let sandboxed = false;

    try {
      document.domain = document.domain;
    } catch (err) {
      if (err instanceof DOMException && err.name === "SecurityError") {
        sandboxed = true;
      }
    }

    if (sandboxed) {
      setIsSandboxed(true);
      setIsloading(false);
      return;
    }

    try {
      if (navigator.plugins.namedItem("Chrome PDF Viewer")) {
        const obj = document.createElement("object");
        obj.data = "data:application/pdf;base64,aG1t";
        obj.style.display = "none";

        obj.onload = () => {
          obj.remove();
        };

        obj.onerror = () => {
          setIsSandboxed(true);
          obj.remove();
        };

        document.body.appendChild(obj);
      }
    } catch {}
  }, []);

  return isSandboxed;
}
