/**
 * VoxAI – API Client
 */

const BASE = "";

async function apiFetch(path, options = {}) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json().catch(() => null);
      msg = body?.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res;
}

/**
 * Transcribe an audio file (File or Blob).
 * @param {File|Blob} file
 * @param {object} options
 * @returns {Promise<object>}
 */
export async function transcribeAudio(file, options = {}) {
  const fd = new FormData();
  fd.append("file", file, file.name || "audio.webm");
  fd.append("language", options.language || "auto");
  fd.append("translate", options.translate ?? false);
  fd.append("summarize", options.summarize ?? false);
  fd.append("sentiment", options.sentiment ?? false);
  fd.append("action_items", options.action_items ?? false);
  fd.append("meeting_outline", options.meeting_outline ?? false);
  fd.append("custom_vocab", options.custom_vocab || "");

  const res = await apiFetch("/api/transcribe", { method: "POST", body: fd });
  return res.json();
}

/**
 * POST to an endpoint and return the raw Response (for binary downloads).
 */
export async function apiPost(path, body, raw = false) {
  const opts = { method: "POST", body };
  return apiFetch(path, opts);
}
