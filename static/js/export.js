/**
 * VoxAI – Export Module
 * Downloads transcript in TXT, SRT, VTT, DOCX, PDF formats.
 */

import { apiPost } from "./api.js";

/**
 * Download transcript in the given format.
 * @param {string} text  - Full transcript text
 * @param {Array}  segs - Segments array from API response
 * @param {string} fmt  - One of: txt, srt, vtt, docx, pdf
 * @param {string} filename
 */
export async function downloadExport(text, segs, fmt, filename = "transcript") {
  try {
    const fd = new FormData();
    fd.append("text", text);
    fd.append("segments", JSON.stringify(segs || []));
    fd.append("format", fmt);

    const res = await apiPost("/api/export", fd, true);
    const blob = await res.blob();

    const mimeMap = {
      txt: "text/plain",
      srt: "application/x-subrip",
      vtt: "text/vtt",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pdf: "application/pdf",
    };
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${fmt}`;
    a.type = mimeMap[fmt] || "application/octet-stream";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert(`Export failed: ${err.message}`);
  }
}

/** Copy text to clipboard */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}