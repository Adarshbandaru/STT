/**
 * VoxAI – Main Controller
 * Integrates: recorder, API, audio player, export, history, settings, batch.
 */

import { transcribeAudio } from "./api.js";
import { AudioRecorder } from "./recorder.js";
import { AudioPlayer } from "./audio-player.js";
import { downloadExport, copyToClipboard } from "./export.js";
import { saveTranscript, getAllTranscripts, deleteTranscript } from "./history.js";
import { getApiKey, setApiKey, initTheme, toggleTheme, getTheme } from "./settings.js";
import { BatchUpload } from "./batch.js";
import {
  setStatus, clearResults, displayTranscript, displaySummary,
  displaySegments, displaySentiment, displayFormatResult,
  showRecordingUI, hideRecordingUI, showAudioPlayer,
  renderBatchQueue, renderHistory, showSettings, hideSettings,
  showToast,
} from "./ui.js";

// ─── State ────────────────────────────────────────────────────────────────────
let recorder = null;
let recordedBlob = null;
let waveformAnimationId = null;
let recordingTimer = null;
let recordingSeconds = 0;
let audioPlayer = null;
let batch = null;
let lastResult = null;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindEvents();
  loadHistory();
  initBatch();
  initAudioPlayer();
  initSettings();
});

function initAudioPlayer() {
  const audioEl = document.getElementById("transcript-audio");
  const transcriptEl = document.getElementById("transcript-text");
  if (audioEl && transcriptEl) {
    audioPlayer = new AudioPlayer({ audioEl, transcriptEl });
  }
}

function initSettings() {
  const keyInput = document.getElementById("api-key-input");
  if (keyInput) keyInput.value = getApiKey();
}

function initBatch() {
  batch = new BatchUpload({
    onProgress: (i, total, item) => {
      renderBatchQueue(batch.getQueue());
      setStatus(`Processing ${i + 1}/${total}…`, "info");
    },
    onComplete: (item, i, results) => {
      renderBatchQueue(batch.getQueue());
      if (i === results.length - 1) {
        setStatus(`Batch complete: ${results.length} files.`, "success");
      }
    },
    onError: (item, err) => {
      renderBatchQueue(batch.getQueue());
      showToast(`Error processing ${item.file.name}: ${err.message}`, "error");
    },
  });
}

// ─── Event Binding ────────────────────────────────────────────────────────────
function bindEvents() {
  // Transcribe button
  document.getElementById("btn-transcribe")?.addEventListener("click", handleTranscription);

  // Record button
  document.getElementById("btn-record")?.addEventListener("click", handleRecordClick);

  // File input change → show waveform mini-preview
  document.getElementById("audio-file")?.addEventListener("change", handleFileSelect);

  // Batch file input
  document.getElementById("batch-files")?.addEventListener("change", handleBatchSelect);

  // Theme toggle
  document.getElementById("btn-theme")?.addEventListener("click", () => {
    const newTheme = toggleTheme();
    updateThemeIcon(newTheme);
  });

  // Settings toggle
  document.getElementById("btn-settings")?.addEventListener("click", () => {
    const panel = document.getElementById("settings-panel");
    if (panel) {
      panel.classList.toggle("hidden");
    }
  });

  // Save API key
  document.getElementById("btn-save-key")?.addEventListener("click", () => {
    const input = document.getElementById("api-key-input");
    if (input) {
      setApiKey(input.value.trim());
      showToast("API key saved.", "success");
    }
  });

  // History toggle
  document.getElementById("btn-history")?.addEventListener("click", () => {
    const panel = document.getElementById("history-panel");
    if (panel) panel.classList.toggle("hidden");
  });

  // Batch toggle
  document.getElementById("btn-batch")?.addEventListener("click", () => {
    const panel = document.getElementById("batch-panel");
    if (panel) panel.classList.toggle("hidden");
  });

  // Copy transcript
  document.getElementById("btn-copy")?.addEventListener("click", async () => {
    const text = document.getElementById("transcript-text")?.textContent;
    if (text) {
      await copyToClipboard(text);
      showToast("Copied to clipboard!", "success");
    }
  });

  // Export buttons
  ["txt", "srt", "vtt", "docx", "pdf"].forEach((fmt) => {
    document.getElementById(`btn-export-${fmt}`)?.addEventListener("click", () => {
      if (!lastResult) return;
      downloadExport(lastResult.text, lastResult.segments, fmt, "transcript");
    });
  });

  // History list delegation
  document.getElementById("history-list")?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-delete-history");
    if (btn) {
      const id = parseInt(btn.dataset.id, 10);
      await deleteTranscript(id);
      loadHistory();
      showToast("Deleted.", "info");
    }
  });

  // Batch process button
  document.getElementById("btn-process-batch")?.addEventListener("click", async () => {
    if (!batch || batch.getQueue().filter((i) => i.status === "pending").length === 0) {
      showToast("No pending files in queue.", "warning");
      return;
    }
    const opts = getTranscribeOptions();
    await batch.processAll(opts);
  });

  // Batch clear
  document.getElementById("btn-clear-batch")?.addEventListener("click", () => {
    batch?.clear();
    renderBatchQueue([]);
  });

  // Close slide panels
  document.getElementById("btn-close-settings")?.addEventListener("click", () => {
    document.getElementById("settings-panel")?.classList.add("hidden");
  });
  document.getElementById("btn-close-history")?.addEventListener("click", () => {
    document.getElementById("history-panel")?.classList.add("hidden");
  });
  document.getElementById("btn-close-batch")?.addEventListener("click", () => {
    document.getElementById("batch-panel")?.classList.add("hidden");
  });

  // Close settings on outside click
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("settings-panel");
    const btn = document.getElementById("btn-settings");
    if (panel && !panel.classList.contains("hidden") &&
        !panel.contains(e.target) && !btn?.contains(e.target)) {
      panel.classList.add("hidden");
    }
  });
}

// ─── Theme Icon ───────────────────────────────────────────────────────────────
function updateThemeIcon(theme) {
  const btn = document.getElementById("btn-theme");
  if (!btn) return;
  btn.textContent = theme === "dark" ? "🌙" : "☀️";
}

// ─── File Select → Waveform Mini-Preview ──────────────────────────────────────
async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const preview = document.getElementById("waveform-mini-preview");
  if (!preview) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);
    const step = Math.ceil(channel.length / 200);
    const peaks = [];
    for (let i = 0; i < channel.length; i += step) {
      let max = 0;
      for (let j = 0; j < step && i + j < channel.length; j++) {
        max = Math.max(max, Math.abs(channel[i + j]));
      }
      peaks.push(max);
    }
    preview.innerHTML = peaks
      .map((p) => `<div class="wave-peak" style="height:${Math.max(2, p * 100)}%"></div>`)
      .join("");
    await audioCtx.close();
  } catch {
    preview.innerHTML = "";
  }
}

// ─── Batch Select ────────────────────────────────────────────────────────────
function handleBatchSelect(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  batch.addFiles(files);
  renderBatchQueue(batch.getQueue());
}

// ─── Record ───────────────────────────────────────────────────────────────────
async function handleRecordClick() {
  if (!recorder || !recorder.isRecording) {
    try {
      recorder = new AudioRecorder(handleRecordingState);
      await recorder.start();
    } catch (err) {
      setStatus(`Mic error: ${err.message}`, "error");
    }
  } else {
    recordedBlob = await recorder.stop();
    const file = new File([recordedBlob], "recording.webm", { type: "audio/webm" });
    const input = document.getElementById("audio-file");
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    setStatus("Recording saved. Click Transcribe to process.", "info");
  }
}

// ─── Recording State ─────────────────────────────────────────────────────────
function handleRecordingState(state) {
  const recBtn = document.getElementById("btn-record");
  const recLabel = document.getElementById("record-label");
  const recTimer = document.getElementById("record-timer");
  const recHint = document.getElementById("record-hint");

  if (state === "recording") {
    recBtn?.classList.add("recording");
    if (recLabel) recLabel.textContent = "Stop";
    if (recHint) recHint.textContent = "Recording in progress…";
    startTimer(recTimer);
    showRecordingUI();
    if (recorder) {
      const analyser = recorder.getAnalyser();
      if (analyser) startWaveform(analyser);
    }
  } else if (state === "done") {
    recBtn?.classList.remove("recording");
    if (recLabel) recLabel.textContent = "Record";
    if (recHint) recHint.textContent = "Upload an audio file or record live speech.";
    stopTimer();
    stopWaveform();
    hideRecordingUI();
  }
}

// ─── Transcribe ───────────────────────────────────────────────────────────────
async function handleTranscription() {
  const fileInput = document.getElementById("audio-file");
  const opts = getTranscribeOptions();

  if (!fileInput?.files?.[0] && !recordedBlob) {
    setStatus("Please upload an audio file or record audio first.", "error");
    return;
  }

  clearResults();
  setStatus("Transcribing… please wait.", "info");

  const file = fileInput?.files?.[0]
    || new File([recordedBlob], "recording.webm", { type: "audio/webm" });

  try {
    const result = await transcribeAudio(file, opts);
    lastResult = result;

    displayTranscript(result.text, result.language);
    if (result.summary) displaySummary(result.summary);
    if (result.segments?.length) displaySegments(result.segments);
    if (result.sentiment) displaySentiment(result.sentiment);
    if (result.formatted_text) displayFormatResult(result.formatted_text);

    // Audio player
    const audioUrl = URL.createObjectURL(file);
    showAudioPlayer(audioUrl);
    if (audioPlayer) audioPlayer.setSegments(result.segments || []);

    // Save to history
    await saveTranscript({
      text: result.text,
      language: result.language,
      summary: result.summary,
      segments: result.segments,
      sentiment: result.sentiment,
    });
    loadHistory();

    setStatus("Transcription complete!", "success");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  }
}

function getTranscribeOptions() {
  return {
    language: document.getElementById("language")?.value?.trim() || "auto",
    translate: document.getElementById("translate")?.checked ?? false,
    summarize: document.getElementById("summarize")?.checked ?? false,
    sentiment: document.getElementById("sentiment-analysis")?.checked ?? false,
    custom_vocab: document.getElementById("custom-vocab")?.value?.trim() || "",
  };
}

// ─── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const records = await getAllTranscripts();
    renderHistory(records);
  } catch (err) {
    console.warn("Could not load history:", err);
  }
}

// ─── Waveform Animation ───────────────────────────────────────────────────────
function startWaveform(analyser) {
  const canvas = document.getElementById("waveform-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    waveformAnimationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = "var(--bg)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const hue = 160 + (dataArray[i] / 255) * 60;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.3)`;
      ctx.fillRect(i * barWidth, 0, barWidth - 1, barHeight);
    }
  }
  draw();
}

function stopWaveform() {
  if (waveformAnimationId) {
    cancelAnimationFrame(waveformAnimationId);
    waveformAnimationId = null;
  }
  const canvas = document.getElementById("waveform-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer(displayEl) {
  recordingSeconds = 0;
  if (displayEl) displayEl.textContent = "00:00";
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    if (displayEl) displayEl.textContent = formatTime(recordingSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(recordingTimer);
  recordingTimer = null;
}
