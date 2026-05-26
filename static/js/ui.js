const statusElement = document.getElementById("status");
const transcriptElement = document.getElementById("transcript");
const summaryElement = document.getElementById("summary");
const segmentsPanel = document.getElementById("segments");
const segmentDataElement = document.getElementById("segment-data");

// ─── Status ───────────────────────────────────────────────────────────────────
export function setStatus(message, level = "info") {
  statusElement.textContent = message;
  statusElement.style.color =
    level === "error" ? "#fca5a5" :
    level === "success" ? "#86efac" :
    level === "warning" ? "#fcd34d" : "#93c5fd";
}

// ─── Clear results ────────────────────────────────────────────────────────────
export function clearResults() {
  transcriptElement.textContent = "";
  summaryElement.textContent = "";
  segmentsPanel.hidden = true;
  segmentDataElement.textContent = "";
}

// ─── Transcript ───────────────────────────────────────────────────────────────
export function displayTranscript(text) {
  transcriptElement.textContent = text || "(no transcript returned)";
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function displaySummary(summary) {
  summaryElement.textContent = summary ? `Summary:\n${summary}` : "";
}

// ─── Segments ────────────────────────────────────────────────────────────────
export function displaySegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    segmentsPanel.hidden = true;
    segmentDataElement.textContent = "";
    return;
  }
  segmentsPanel.hidden = false;
  segmentDataElement.textContent = JSON.stringify(segments, null, 2);
}

// ─── Recording UI helpers ─────────────────────────────────────────────────────
export function showRecordingUI() {
  const panel = document.getElementById("recording-panel");
  if (panel) { panel.style.display = "flex"; panel.classList.add("visible"); }
}

export function hideRecordingUI() {
  const panel = document.getElementById("recording-panel");
  if (panel) { panel.style.display = "none"; panel.classList.remove("visible"); }
}

export function updateWaveform(_data) {
  // Reserved for future: pass waveform data to canvas
}
