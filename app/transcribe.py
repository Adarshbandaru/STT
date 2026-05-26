import os
import tempfile
from pathlib import Path
from typing import Dict, Optional

import openai
from openai import OpenAI

try:
    import whisper
except ImportError:  # type: ignore
    whisper = None  # type: ignore

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def transcribe_with_openai(audio_path: Path, language: str = "auto", translate: bool = False) -> Dict:
    client = OpenAI(api_key=OPENAI_API_KEY)
    with open(audio_path, "rb") as audio_file:
        task = "translate" if translate else "transcribe"
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            language=language if language != "auto" else None,
            task=task,
        )

    return {
        "text": response.get("text", ""),
        "segments": response.get("segments", []),
        "language": response.get("language", language),
        "engine": "openai-whisper",
        "translated": translate,
    }


def transcribe_with_whisper(audio_path: Path, language: str = "auto", translate: bool = False) -> Dict:
    if whisper is None:
        raise RuntimeError("Whisper is not installed. Install it with `pip install whisper` or set OPENAI_API_KEY.")

    model = whisper.load_model("small")
    task = "translate" if translate else "transcribe"
    whisper_opts = {
        "language": None if language == "auto" else language,
        "task": task,
        "verbose": False,
    }

    result = model.transcribe(str(audio_path), **whisper_opts)
    return {
        "text": result.get("text", ""),
        "segments": [
            {"start": float(seg["start"]), "end": float(seg["end"]), "text": seg["text"]}
            for seg in result.get("segments", [])
        ],
        "language": result.get("language", language),
        "engine": "local-whisper",
        "translated": translate,
    }


def transcribe_audio(audio_path: Path, language: str = "auto", translate: bool = False) -> Dict:
    if OPENAI_API_KEY:
        return transcribe_with_openai(audio_path, language=language, translate=translate)
    return transcribe_with_whisper(audio_path, language=language, translate=translate)


def summarize_text(text: str) -> Optional[str]:
    if not OPENAI_API_KEY:
        return None

    client = OpenAI(api_key=OPENAI_API_KEY)
    prompt = (
        "Summarize the following transcript in a concise and readable paragraph:\n\n" + text
    )
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        max_output_tokens=200,
    )

    return response.output_text.strip() if response and response.output_text else None
