/**
 * VoxAI – Batch Upload Manager
 * Handles multiple file uploads with queue processing.
 */

import { transcribeAudio } from "./api.js";

export class BatchUpload {
  constructor({ onProgress, onComplete, onError }) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.queue = [];
    this.results = [];
    this.processing = false;
  }

  addFiles(files) {
    for (const f of files) {
      if (!f.type.startsWith("audio/") && !f.name.match(/\.(mp3|wav|webm|ogg|m4a|flac|aac|pcm)$/i)) {
        continue;
      }
      this.queue.push({ file: f, id: crypto.randomUUID(), status: "pending", result: null, error: null });
    }
    return this.queue.length;
  }

  async processAll(options = {}) {
    if (this.processing) return;
    this.processing = true;
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (item.status !== "pending") continue;
      item.status = "processing";
      this.onProgress?.(i, this.queue.length, item);
      try {
        const result = await transcribeAudio(item.file, options);
        item.result = result;
        item.status = "done";
        this.results.push(item);
        this.onComplete?.(item, i, this.results);
      } catch (err) {
        item.error = err.message;
        item.status = "error";
        this.onError?.(item, err);
      }
    }
    this.processing = false;
    return this.results;
  }

  getQueue() {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.results = [];
    this.processing = false;
  }
}