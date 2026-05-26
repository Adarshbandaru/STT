import { transcribeAudio } from "./api.js";
import { AudioRecorder } from "./recorder.js";
import { setStatus, clearResults, displayTranscript, displaySummary, displaySegments, showRecordingUI, hideRecordingUI, updateWaveform } from "./ui.js";

let recorder = null;
let recordedBlob = null;
let waveformAnimationId = null;
let recordingTimer = null;
let recordingSeconds = 0;

// ─── Waveform animation ───────────────────────────────────────────────────────
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
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const hue = 160 + (dataArray[i] / 255) * 60;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
    }

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const hue = 160 + (dataArray[i] / 255) * 60;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.3)`;
      ctx.fillRect(x, 0, barWidth - 1, barHeight);
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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function startTimer(displayEl) {
  recordingSeconds = 0;
  displayEl.textContent = "00:00";
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    displayEl.textContent = formatTime(recordingSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(recordingTimer);
  recordingTimer = null;
}

// ─── Recording state handler ──────────────────────────────────────────────────
function handleRecordingState(state) {
  const recordBtn = document.getElementById("record-btn");
  const recordLabel = document.getElementById("record-label");
  const recordTimer = document.getElementById("record-timer");
  const recordHint = document.getElementById("record-hint");

  if (state === "recording") {
    recordBtn.classList.add("recording");
    recordLabel.textContent = "Stop";
    recordHint.textContent = "Recording in progress...";
    startTimer(recordTimer);
    showRecordingUI();
    if (recorder) {
      const analyser = recorder.getAnalyser();
      if (analyser) startWaveform(analyser);
    }
  } else if (state === "done") {
    recordBtn.classList.remove("recording");
    recordLabel.textContent = "Record";
    recordHint.textContent = "Upload an audio file or record live speech.";
    stopTimer();
    stopWaveform();
    hideRecordingUI();
  }
}

// ─── Record button ────────────────────────────────────────────────────────────
document.getElementById("record-btn").addEventListener("click", async () => {
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
});

// ─── Form submit ──────────────────────────────────────────────────────────────
document.getElementById("transcribe-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await handleTranscription();
});

async function handleTranscription() {
  const fileInput = document.getElementById("audio-file");
  const language = document.getElementById("language").value.trim();
  const translate = document.getElementById("translate").checked;
  const summarize = document.getElementById("summarize").checked;

  if (!fileInput.files[0] && !recordedBlob) {
    setStatus("Please upload an audio file or record audio first.", "error");
    return;
  }

  clearResults();
  setStatus("Transcribing... please wait.", "info");

  const formData = new FormData();
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  } else {
    formData.append("file", new File([recordedBlob], "recording.webm", { type: "audio/webm" }));
  }
  formData.append("language", language || "auto");
  formData.append("translate", String(translate));
  formData.append("summarize", String(summarize));

  try {
    const result = await transcribeAudio(formData);
    displayTranscript(result.text);
    if (result.summary) displaySummary(result.summary);
    if (result.segments?.length) displaySegments(result.segments);
    setStatus("Transcription complete!", "success");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  }
}
