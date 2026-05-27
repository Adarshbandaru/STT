/**
 * VoxAI – UI Helpers
 * All DOM queries are lazy (on demand) to avoid null-reference errors.
 */

function $id(id) {
  return document.getElementById(id);
}

// ─── Status ──────────────────────────────────────────────────────────────────

export function setStatus(msg, type = "info") {
  const el = $id("status-text");
  const chip = $id("status-chip");
  if (el) el.textContent = msg;
  if (chip) {
    chip.textContent = msg;
    chip.className = `status-chip status-${type}`;
  }
}

// ─── Results ─────────────────────────────────────────────────────────────────

export function clearResults() {
  const sections = [
    "transcript-text", "summary-text", "segments-list",
    "sentiment-result", "format-result", "action-items-list",
    "outline-text", "metrics-fillers-list",
  ];
  sections.forEach((id) => {
    const el = $id(id);
    if (el) el.innerHTML = "";
  });
  
  const elements = {
    "lang-badge": "",
    "metrics-clarity-val": "—",
    "metrics-wpm-val": "—",
    "metrics-words-val": "—",
  };
  for (const [id, val] of Object.entries(elements)) {
    const el = $id(id);
    if (el) el.textContent = val;
  }
  
  const ring = $id("clarity-ring-progress");
  if (ring) ring.style.strokeDashoffset = 251.2;
  
  const wpmBadge = $id("metrics-wpm-status");
  if (wpmBadge) {
    wpmBadge.textContent = "—";
    wpmBadge.className = "metrics-status-badge";
  }

  const audioPlayer = $id("audio-player-container");
  if (audioPlayer) audioPlayer.classList.add("hidden");
}

export function displayTranscript(text, lang) {
  const el = $id("transcript-text");
  if (el) el.textContent = text || "No transcript returned.";
  const badge = $id("lang-badge");
  if (badge) {
    badge.textContent = lang && lang !== "auto" ? lang.toUpperCase() : "AUTO";
    badge.classList.remove("hidden");
  }
}

export function displaySummary(text) {
  const el = $id("summary-text");
  if (el) {
    if (!text) {
      el.innerHTML = "No summary available.";
    } else {
      let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="glow-strong">$1</strong>');
      el.innerHTML = formatted;
    }
  }
  const sec = $id("summary-section");
  if (sec) sec.classList.remove("hidden");
}

export function displaySegments(segments) {
  const list = $id("segments-list");
  if (!list) return;
  list.innerHTML = "";
  if (!segments?.length) return;
  for (const seg of segments) {
    const li = document.createElement("li");
    li.className = "segment-item";
    const start = _fmt(seg.start || 0);
    const end = _fmt(seg.end || 0);
    li.innerHTML = `
      <div class="segment-header">
        <span class="seg-time">${start} → ${end}</span>
        <button class="btn-icon seg-play" data-start="${seg.start}" title="Play from here">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <p class="seg-text">${seg.text?.trim() || ""}</p>
    `;
    list.appendChild(li);
  }
  list.querySelectorAll(".seg-play").forEach((btn) => {
    btn.addEventListener("click", () => {
      const audio = $id("transcript-audio");
      if (audio) {
        audio.currentTime = parseFloat(btn.dataset.start);
        audio.play();
      }
    });
  });
}

export function displaySentiment(sentiment) {
  const el = $id("sentiment-result");
  if (!el) return;
  el.classList.remove("hidden");
  const label = sentiment?.label || "unknown";
  const conf = sentiment?.confidence != null ? (sentiment.confidence * 100).toFixed(0) : "—";
  const reason = sentiment?.reason || "";
  const emoji = label === "positive" ? "😊" : label === "negative" ? "😞" : label === "neutral" ? "😐" : "❓";
  el.innerHTML = `<span class="sentiment-label">${emoji} ${label.toUpperCase()}</span><span class="sentiment-conf">${conf}%</span>${reason ? `<span class="sentiment-reason">${reason}</span>` : ""}`;
}

export function displayFormatResult(text) {
  const el = $id("format-result");
  if (el) {
    el.textContent = text;
    el.classList.remove("hidden");
  }
}

// ─── Speaking Metrics, Outline, & Actions (2026 AI Era) ─────────────────────

export function displayActionItems(items) {
  const list = $id("action-items-list");
  if (!list) return;
  list.innerHTML = "";
  
  if (!items || !items.length) {
    list.innerHTML = '<li class="empty-state">No action items identified.</li>';
    return;
  }
  
  let idx = 0;
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "action-task-item cascade-item";
    li.style.animationDelay = `${idx * 60}ms`;
    idx++;
    const taskId = "task-" + Math.random().toString(36).substring(2, 7);
    li.innerHTML = `
      <label class="task-checkbox-label">
        <input type="checkbox" id="${taskId}" class="task-check-input" />
        <span class="task-custom-checkbox"></span>
        <span class="task-text">${item}</span>
      </label>
    `;
    list.appendChild(li);
    
    const cb = li.querySelector(".task-check-input");
    cb.addEventListener("change", () => {
      if (cb.checked) {
        li.classList.add("completed");
      } else {
        li.classList.remove("completed");
      }
    });
  }
}

export function displayMeetingOutline(outline) {
  const el = $id("outline-text");
  if (!el) return;
  
  if (!outline) {
    el.innerHTML = '<p class="empty-state">No structured outline generated.</p>';
    return;
  }
  
  const lines = outline.split("\n");
  let html = '<div class="outline-container">';
  let inList = false;
  let cardCount = 0;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Parse bold text into high-contrast glow tags
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="glow-strong">$1</strong>');
    
    if (line.startsWith("###")) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      const title = line.replace(/^###\s*/, "");
      html += `<h3 class="outline-main-title">${title}</h3>`;
    } else if (line.startsWith("####")) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      cardCount++;
      const subtitle = line.replace(/^####\s*/, "");
      if (cardCount > 1) {
        html += '</div></div>';
      }
      html += `
        <div class="agenda-card cascade-item" style="animation-delay: ${cardCount * 80}ms">
          <div class="agenda-card-header">
            <span class="agenda-dot-indicator"></span>
            <h4 class="agenda-card-title">${subtitle}</h4>
          </div>
          <div class="agenda-card-body">
      `;
    } else if (line.startsWith("-") || line.startsWith("*")) {
      if (!inList) {
        html += '<ul class="agenda-bullet-list">';
        inList = true;
      }
      const content = line.replace(/^[-*]\s*/, "");
      html += `<li class="agenda-bullet-item">${content}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<p class="agenda-plain-text">${line}</p>`;
    }
  }
  
  if (inList) {
    html += '</ul>';
  }
  if (cardCount > 0) {
    html += '</div></div>';
  }
  html += '</div>';
  
  el.innerHTML = html;
}

export function displaySpeakingMetrics(metrics) {
  if (!metrics) return;
  
  const clarityVal = $id("metrics-clarity-val");
  const wpmVal = $id("metrics-wpm-val");
  const wordsVal = $id("metrics-words-val");
  const fillersList = $id("metrics-fillers-list");
  
  if (clarityVal) {
    clarityVal.textContent = `${metrics.clarity_score}%`;
    const ring = $id("clarity-ring-progress");
    if (ring) {
      const percent = metrics.clarity_score || 0;
      const offset = 251.2 - (percent / 100) * 251.2;
      ring.style.strokeDashoffset = offset;
    }
  }
  if (wpmVal) {
    wpmVal.textContent = metrics.wpm || "—";
    const status = $id("metrics-wpm-status");
    if (status) {
      const wpm = metrics.wpm || 130;
      if (wpm >= 110 && wpm <= 160) {
        status.textContent = "Optimal Speed";
        status.className = "metrics-status-badge optimal";
      } else if (wpm > 160) {
        status.textContent = "Fast Speaking";
        status.className = "metrics-status-badge fast";
      } else {
        status.textContent = "Slow Speaking";
        status.className = "metrics-status-badge slow";
      }
    }
  }
  if (wordsVal) wordsVal.textContent = metrics.word_count || "0";
  
  if (fillersList) {
    fillersList.innerHTML = "";
    if (metrics.filler_words && Object.keys(metrics.filler_words).length > 0) {
      for (const [word, count] of Object.entries(metrics.filler_words)) {
        const span = document.createElement("span");
        span.className = "filler-pill";
        span.innerHTML = `<strong>${word}</strong> ${count}x`;
        fillersList.appendChild(span);
      }
    } else {
      fillersList.innerHTML = '<span class="empty-state" style="font-size: 0.75rem;">No filler words detected! Outstanding clarity.</span>';
    }
  }
}

// ─── Recording UI ─────────────────────────────────────────────────────────────

export function showRecordingUI() {
  const panel = $id("recording-panel");
  const recBtn = $id("btn-record");
  if (panel) panel.classList.add("visible");
  if (recBtn) recBtn.classList.add("recording");
}

export function hideRecordingUI() {
  const panel = $id("recording-panel");
  const recBtn = $id("btn-record");
  if (panel) panel.classList.remove("visible");
  if (recBtn) recBtn.classList.remove("recording");
}

// ─── Waveform (stub — actual drawing in index.js) ─────────────────────────────

export function updateWaveform(_analyser) {}

// ─── Audio Player ─────────────────────────────────────────────────────────────

export function showAudioPlayer(audioUrl) {
  const container = $id("audio-player-container");
  const audio = $id("transcript-audio");
  if (!container || !audio) return;
  audio.src = audioUrl;
  audio.load();
  container.classList.remove("hidden");
}

export function hideAudioPlayer() {
  const container = $id("audio-player-container");
  if (container) container.classList.add("hidden");
}

// ─── Batch Queue ─────────────────────────────────────────────────────────────

export function renderBatchQueue(items) {
  const list = $id("batch-queue");
  if (!list) return;
  list.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.className = `batch-item batch-${item.status}`;
    li.innerHTML = `
      <span class="batch-name">${item.file.name}</span>
      <span class="batch-status">${item.status === "done" ? "✓" : item.status === "error" ? "✗" : item.status === "processing" ? "…" : "○"}</span>
    `;
    list.appendChild(li);
  }
}

// ─── History Panel ────────────────────────────────────────────────────────────

export function renderHistory(records) {
  const list = $id("history-list");
  if (!list) return;
  list.innerHTML = "";
  if (!records.length) {
    list.innerHTML = '<li class="empty-state">No transcriptions yet.</li>';
    return;
  }
  for (const rec of records.slice().reverse()) {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = new Date(rec.timestamp).toLocaleString();
    li.innerHTML = `
      <div class="history-meta">
        <span class="history-date">${date}</span>
        <span class="history-lang">${(rec.language || "auto").toUpperCase()}</span>
      </div>
      <p class="history-preview">${(rec.text || "").slice(0, 120)}${(rec.text || "").length > 120 ? "…" : ""}</p>
      <button class="btn-sm btn-delete-history" data-id="${rec.id}">Delete</button>
    `;
    list.appendChild(li);
  }
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

export function showSettings() {
  const panel = $id("settings-panel");
  if (panel) panel.classList.remove("hidden");
}

export function hideSettings() {
  const panel = $id("settings-panel");
  if (panel) panel.classList.add("hidden");
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let _toastTimer;
export function showToast(msg, type = "info", duration = 3000) {
  let toast = $id("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast-${type} toast-show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("toast-show"), duration);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _fmt(seconds) {
  if (seconds == null) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
