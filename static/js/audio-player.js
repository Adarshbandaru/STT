/**
 * VoxAI – Audio Playback & Word Highlighting
 * Plays uploaded/recorded audio with transcript word-level sync.
 */

export class AudioPlayer {
  constructor({ audioEl, transcriptEl, onTimeUpdate }) {
    this.audio = audioEl;
    this.transcriptEl = transcriptEl;
    this.onTimeUpdate = onTimeUpdate;
    this.segments = [];
    this.currentSegmentIdx = -1;
    if (audioEl) this._bind();
  }

  _bind() {
    this.audio.addEventListener("timeupdate", () => this._onTimeUpdate());
    this.audio.addEventListener("ended", () => this._onEnded());
    this.audio.addEventListener("loadedmetadata", () => this._onLoaded());
  }

  _onLoaded() {
    this._buildWordSpans();
  }

  _onTimeUpdate() {
    const t = this.audio.currentTime;
    this.onTimeUpdate?.(t, this.audio.duration);
    this._highlightWord(t);
  }

  _onEnded() {
    this._clearHighlights();
  }

  setSegments(segments) {
    this.segments = segments;
    this._buildWordSpans();
  }

  _buildWordSpans() {
    if (!this.transcriptEl || !this.segments.length) return;
    // Replace text content with timestamped spans
    const parts = [];
    for (const seg of this.segments) {
      const start = parseFloat(seg.start || 0);
      const end = parseFloat(seg.end || 0);
      const words = seg.text?.trim() || "";
      if (!words) continue;
      // Wrap each word
      const wordParts = words.split(/(\s+)/);
      for (const wp of wordParts) {
        if (/^\s+$/.test(wp)) {
          parts.push(wp);
        } else {
          parts.push(`<span class="tw-word" data-start="${start}" data-end="${end}">${wp}</span>`);
        }
      }
    }
    this.transcriptEl.innerHTML = parts.join("");
    // Bind click-to-seek on words
    this.transcriptEl.querySelectorAll(".tw-word").forEach((span) => {
      span.addEventListener("click", () => {
        const start = parseFloat(span.dataset.start);
        if (!isNaN(start)) {
          this.audio.currentTime = start;
          this.audio.play();
        }
      });
    });
  }

  _highlightWord(t) {
    const spans = this.transcriptEl?.querySelectorAll(".tw-word");
    if (!spans) return;
    spans.forEach((s) => s.classList.remove("tw-active"));
    for (const span of spans) {
      const start = parseFloat(span.dataset.start);
      const end = parseFloat(span.dataset.end);
      if (t >= start && t <= end) {
        span.classList.add("tw-active");
        span.scrollIntoView({ behavior: "smooth", block: "nearest" });
        break;
      }
    }
  }

  _clearHighlights() {
    this.transcriptEl?.querySelectorAll(".tw-word").forEach((s) => s.classList.remove("tw-active"));
  }

  seekTo(time) {
    this.audio.currentTime = time;
  }

  play() {
    this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  get duration() {
    return this.audio.duration || 0;
  }

  get currentTime() {
    return this.audio.currentTime || 0;
  }
}