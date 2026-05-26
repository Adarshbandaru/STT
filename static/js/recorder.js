/**
 * AudioRecorder with live waveform visualizer support.
 * Handles microphone capture and provides analyser node for visualization.
 */
export class AudioRecorder {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.recorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
  }

  get isRecording() {
    return this.recorder?.state === "recording";
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser does not support audio recording.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // Set up audio context for waveform
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.sourceNode.connect(this.analyser);

    this.recordedChunks = [];
    this.recorder = new MediaRecorder(this.stream, { mimeType: "audio/webm" });

    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    });

    this.recorder.start(100); // Collect data every 100ms
    this.onStateChange("recording");
    return true;
  }

  async stop() {
    if (!this.recorder) return null;

    return new Promise((resolve, reject) => {
      this.recorder.addEventListener("stop", () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.stream?.getTracks().forEach((track) => track.stop());
        this.audioContext?.close();
        this.recorder = null;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.sourceNode = null;
        this.onStateChange("done");
        resolve(blob);
      });

      try {
        this.recorder.stop();
      } catch (error) {
        reject(error);
      }
    });
  }

  getAnalyser() {
    return this.analyser;
  }
}
