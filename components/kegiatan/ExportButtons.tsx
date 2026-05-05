"use client";

import { useState } from "react";

export function ExportButtons({
  onExport
}: {
  onExport: (format: "pdf" | "docx") => Promise<void>;
}) {
  const [loadingFormat, setLoadingFormat] = useState<"" | "pdf" | "docx">("");

  async function handleExport(format: "pdf" | "docx") {
    setLoadingFormat(format);
    try {
      await onExport(format);
    } finally {
      setLoadingFormat("");
    }
  }

  return (
    <>
      <button
        className="button secondary"
        disabled={loadingFormat !== ""}
        onClick={() => handleExport("docx")}
        type="button"
      >
        {loadingFormat === "docx" ? "Mengekspor..." : "Export Word"}
      </button>
      <button
        className="button primary"
        disabled={loadingFormat !== ""}
        onClick={() => handleExport("pdf")}
        type="button"
      >
        {loadingFormat === "pdf" ? "Mengekspor..." : "Export PDF"}
      </button>
    </>
  );
}

