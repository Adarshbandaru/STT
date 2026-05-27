<p align="center">
  <img src="https://img.shields.io/badge/VoxAI-Cognitive_Audio_Intelligence-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMTIgMmEzIDMgMCAwIDAtMyAzdjdhMyAzIDAgMCAwIDYgMFY1YTMgMyAwIDAgMC0zLTNaIi8+PHBhdGggZD0iTTE5IDEwdjJhNyA3IDAgMCAxLTE0IDB2LTIiLz48L3N2Zz4=" alt="VoxAI"/>
</p>

<h1 align="center">🎙️ VoxAI — Cognitive Audio Intelligence Portal</h1>

<p align="center">
  <strong>A fully offline, production-grade speech-to-text platform with AI-powered cognitive analysis.</strong><br/>
  Record or upload audio → Transcribe locally → Get AI summaries, sentiment, action items & speaking analytics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.105+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Whisper-Local_AI-FF6F00?style=flat-square&logo=openai&logoColor=white" alt="Whisper"/>
  <img src="https://img.shields.io/badge/Zero_API_Keys-Fully_Offline-22c55e?style=flat-square" alt="Offline"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"/>
</p>

---

## ✨ What is VoxAI?

VoxAI is a **self-hosted, offline-first** audio intelligence platform that transforms speech into structured, actionable insights — all running locally on your machine with **zero API keys required**.

Unlike basic speech-to-text tools, VoxAI acts as a **cognitive co-pilot** that automatically:
- 📝 **Transcribes** audio with word-level timestamps
- 🧠 **Summarizes** key talking points using extractive NLP
- 💡 **Extracts action items** from conversations
- 📊 **Analyzes sentiment** (positive / neutral / negative)
- 📋 **Generates structured meeting outlines** with topic clustering
- 🎯 **Measures speaking performance** — WPM, clarity score, filler words

---

## 🚀 Features

### Core Transcription
| Feature | Description |
|---------|-------------|
| 🎤 **Live Recording** | Record directly from your browser with real-time neon equalizer visualization |
| 📁 **File Upload** | Drag & drop support for MP3, WAV, M4A, OGG, WebM (any size) |
| 🌍 **Language Detection** | Automatic language identification with manual override |
| 🔄 **Translation** | Translate any language to English during transcription |
| ⚡ **Local Processing** | OpenAI Whisper runs entirely on your machine — no cloud, no API keys |

### AI Cognitive Pipeline (100% Offline)
| Feature | Description |
|---------|-------------|
| 📝 **Smart Summary** | Frequency-based extractive summarizer ranks and selects key sentences |
| 😊 **Sentiment Analysis** | Lexicon-based scanner with confidence scoring and contextual reasoning |
| ✅ **Action Item Extraction** | Regex + keyword task scanner detects responsibilities and follow-ups |
| 📋 **Meeting Outline** | Chronological block clustering into Executive Briefing → Core Discussion → Next Steps |
| 🎯 **Speaking Analytics** | Words per minute, speech clarity score, filler word detection |

### Premium UI/UX
| Feature | Description |
|---------|-------------|
| 🌙 **Cyber-Dark Theme** | Glassmorphic panels with frosted backdrop blur and ambient drift animations |
| ✨ **Neon Equalizer** | Symmetrical rounded-bar waveform with purple-indigo gradients during recording |
| 🔮 **Laser Scanner** | Animated scanning line on the upload drop zone |
| 💊 **Capsule Buttons** | Pill-shaped buttons with glow shadows and hover elevation |
| 🎭 **Cascading Animations** | Staggered slide-in reveals for dashboard cards and checklist items |
| 📱 **Responsive** | Fully responsive grid layout — works on desktop and tablet |

### Export & Persistence
| Feature | Description |
|---------|-------------|
| 📄 **Multi-Format Export** | TXT, SRT, VTT, DOCX, PDF — one-click download |
| 💾 **Local History** | All transcriptions saved in IndexedDB with full session restore |
| 📦 **Batch Processing** | Queue multiple files for sequential transcription |

---

## 🏗️ Architecture

```
VoxAI/
├── app/
│   ├── main.py              # FastAPI server, routes, WebSocket manager
│   └── transcribe.py        # Whisper engine, NLP pipeline, export generators
├── static/
│   ├── index.html           # Single-page application shell
│   ├── css/
│   │   └── app.css          # Design system — glassmorphism, animations, layout
│   └── js/
│       ├── index.js          # Main controller — event binding, state management
│       ├── api.js            # HTTP client for /api/transcribe
│       ├── recorder.js       # MediaRecorder + AudioContext + AnalyserNode
│       ├── audio-player.js   # Karaoke-style segment playback
│       ├── ui.js             # DOM renderers — tabs, metrics, outlines, toasts
│       ├── history.js        # IndexedDB CRUD for transcription history
│       ├── export.js         # Client-side download and clipboard helpers
│       ├── batch.js          # Multi-file queue processor
│       └── settings.js       # Theme toggle and API key storage
└── requirements.txt
```

**Backend:** FastAPI serves the static SPA and exposes a single `POST /api/transcribe` endpoint.  
**Frontend:** Vanilla JS (ES modules) + Vanilla CSS — zero frameworks, zero build step.  
**AI Engine:** OpenAI Whisper (local) for transcription + custom heuristic NLP for analysis.

---

## ⚡ Quick Start

### Prerequisites
- **Python 3.10+**
- **ffmpeg** (required by Whisper for audio decoding)

### 1. Clone the repository

```bash
git clone https://github.com/Adarshbandaru/STT.git
cd STT
```

### 2. Create a virtual environment (optional but recommended)

```bash
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
pip install openai-whisper
```

### 4. Install ffmpeg

```bash
# Windows (winget)
winget install --id Gyan.FFmpeg -e

# macOS (Homebrew)
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

### 5. Run the server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 9090
```

### 6. Open in browser

```
http://127.0.0.1:9090
```

That's it! No API keys, no cloud accounts, no configuration files. Just run and use.

---

## 🎯 Usage Guide

### Record & Transcribe
1. Click **Record** → speak into your microphone → click **Stop**
2. Toggle the AI features you want (Summary, Sentiment, Action Items, Outline)
3. Click **Transcribe**
4. Browse the results across 4 dashboard tabs:
   - **Transcript** — full text with interactive karaoke segments
   - **AI Briefing** — summary, sentiment, and structured meeting outline
   - **Action Tasks** — interactive checklist with checkable items
   - **Speaking Analytics** — clarity score ring, WPM gauge, filler word report

### Upload & Transcribe
1. Drag an audio file onto the upload zone (or click **browse**)
2. Select your options and click **Transcribe**

### Export
Click any format button: **TXT** · **SRT** · **VTT** · **DOCX** · **PDF**

---

## ⚙️ Configuration

### Optional: OpenAI API Key
If you have an OpenAI API key, VoxAI will use the cloud Whisper API for potentially faster transcription:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY = "sk-your-key-here"

# macOS / Linux
export OPENAI_API_KEY="sk-your-key-here"
```

**Without an API key**, the app automatically uses the local Whisper model — no configuration needed.

### Whisper Model Selection
By default, VoxAI uses the `base` model (~140MB, fast). To change it, edit `app/transcribe.py`:

```python
model = whisper.load_model("base")    # Fast, good accuracy
model = whisper.load_model("small")   # Better accuracy, slower
model = whisper.load_model("medium")  # High accuracy, requires more RAM
model = whisper.load_model("large")   # Best accuracy, requires GPU
```

---

## 🧠 Offline NLP Engines

When no OpenAI API key is set, VoxAI deploys custom offline algorithms:

| Engine | Method |
|--------|--------|
| **Summarizer** | TF-based sentence scoring with stopword filtering — extracts top 3 most informative sentences |
| **Sentiment** | Lexicon scanner with 40+ positive/negative keywords, confidence ratio, and contextual reasoning |
| **Action Items** | Multi-pass regex: modal verbs (`need to`, `should`, `must`) + workflow keywords (`schedule`, `deploy`, `email`) |
| **Outline** | Chronological 3-block splitter with keyword frequency extraction per block |
| **Formatter** | Sentence capitalization, pronoun fixing (`i` → `I`), logical paragraph grouping |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **AI Engine** | OpenAI Whisper (local), Custom NLP heuristics |
| **Frontend** | Vanilla JS (ES Modules), Vanilla CSS |
| **Storage** | IndexedDB (browser-side) |
| **Typography** | Inter (Google Fonts) |
| **Audio** | Web Audio API, MediaRecorder API |
| **Export** | python-docx, ReportLab |

---

## 📄 API Reference

### `POST /api/transcribe`

Transcribe an audio file with optional AI analysis.

**Form Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | File | required | Audio file (MP3, WAV, M4A, OGG, WebM) |
| `language` | string | `"auto"` | Language code or `"auto"` for detection |
| `translate` | bool | `false` | Translate to English |
| `summarize` | bool | `false` | Generate AI summary |
| `sentiment` | bool | `false` | Run sentiment analysis |
| `action_items` | bool | `false` | Extract action items |
| `meeting_outline` | bool | `false` | Generate meeting outline |
| `custom_vocab` | string | `""` | Boost words for recognition |

**Response:**
```json
{
  "text": "Full transcription text...",
  "segments": [{"start": 0.0, "end": 2.5, "text": "Hello world"}],
  "language": "en",
  "engine": "local-whisper",
  "summary": "Key points from the recording...",
  "sentiment": {"label": "positive", "confidence": 0.85, "reason": "..."},
  "metrics": {"word_count": 150, "wpm": 130, "clarity_score": 92, "filler_words": {}},
  "action_items": ["Review transcript details", "Follow up on agenda"],
  "meeting_outline": "### Meeting Briefing Outline\n..."
}
```

### `GET /api/health`
Returns `{"status": "ok", "backend": "VoxAI", "version": "1.0.0"}`

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with 🎙️ by <a href="https://github.com/Adarshbandaru">Adarsh Bandaru</a>
</p>
