import os
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.transcribe import summarize_text, transcribe_audio

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="Advanced STT",
    description="Speech-to-text service with browser recording, file upload, translation, and summarization.",
    version="0.1.0",
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "Advanced STT"}


@app.post("/api/transcribe")
async def api_transcribe(
    file: UploadFile = File(...),
    language: str = Form("auto"),
    translate: bool = Form(False),
    summarize: bool = Form(False),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        temp_path = Path(tmp_file.name)

    try:
        transcript = transcribe_audio(temp_path, language=language, translate=translate)
        if summarize:
            transcript["summary"] = summarize_text(transcript["text"])
        return JSONResponse(content=transcript)
    finally:
        try:
            temp_path.unlink()
        except OSError:
            pass


@app.get("/api/summary")
def api_summary(text: str):
    result = summarize_text(text)
    if result is None:
        raise HTTPException(status_code=400, detail="Summarization requires OPENAI_API_KEY.")
    return {"summary": result}
