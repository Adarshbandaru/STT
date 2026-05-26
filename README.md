# Advanced STT

A modern speech-to-text application scaffolding with both API and web UI support. The project can transcribe audio uploads and browser-recorded speech, optionally translate output, and generate summaries when OpenAI API credentials are available.

## Features

- FastAPI backend with REST `/api/transcribe`
- Web UI for recording audio and uploading files
- Optional OpenAI Whisper API integration via `OPENAI_API_KEY`
- Local fallback to open-source Whisper model when no API key is provided
- Language detection and translation support
- Transcript segments and optional summary generation
- Simple, extensible architecture for mobile or desktop upgrade

## Setup

1. Create a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Install `ffmpeg` if using local Whisper or audio conversion.

4. Set your OpenAI API key if you want cloud transcription and summarization:

```powershell
$env:OPENAI_API_KEY = "your_api_key"
```

5. Run the app:

```powershell
uvicorn app.main:app --reload
```

6. Open `http://127.0.0.1:8000/static/index.html` in your browser.

The front-end is now organized for easy editing:
- `static/index.html` — user interface layout
- `static/css/app.css` — page styling and responsive design
- `static/js/index.js` — form and page event wiring
- `static/js/api.js` — backend API request logic
- `static/js/recorder.js` — microphone recording support
- `static/js/ui.js` — status and result rendering helpers

## Usage

- Upload audio files in WAV, MP3, or OGG format.
- Record directly from the browser.
- Choose auto language detection, translation, and optional transcript summaries.

## Advanced upgrade path

- Add speaker diarization with `whisperx`
- Add user authentication and transcription history storage
- Add export options for SRT, VTT, or Word documents
- Add real-time streaming transcription to a WebSocket API
