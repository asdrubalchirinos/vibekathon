"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const text = value.startsWith("http")
        ? value
        : `${window.location.origin}${value.startsWith("/") ? "" : "/"}${value}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={copy}>
      {copied ? "Copiado" : label}
    </button>
  );
}
