import os
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from app.transcribe import (
    analyze_sentiment,
    auto_format_text,
    export_as_docx,
    export_as_pdf,
    export_as_srt,
    export_as_txt,
    export_as_vtt,
    summarize_text,
    transcribe_audio,
    extract_action_items,
    generate_meeting_outline,
    calculate_speaking_metrics,
)

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="VoxAI",
    description="Professional speech-to-text with live recording, translation, summarization, and more.",
    version="1.0.0",
)


@app.get("/")
def read_root():
    return FileResponse(BASE_DIR / "static" / "index.html")


app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


# ─── WebSocket connection manager ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_text(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()


# ─── API Routes ───────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "VoxAI", "version": "1.0.0"}


@app.post("/api/transcribe")
async def api_transcribe(
    file: UploadFile = File(...),
    language: str = Form("auto"),
    translate: bool = Form(False),
    summarize: bool = Form(False),
    sentiment: bool = Form(False),
    action_items: bool = Form(False),
    meeting_outline: bool = Form(False),
    custom_vocab: str = Form(""),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        temp_path = Path(tmp_file.name)

    try:
        result = transcribe_audio(
            temp_path,
            language=language,
            translate=translate,
            custom_vocab=custom_vocab,
        )
        if result.get("text"):
            # Estimate duration based on segments to pass to metrics engine
            duration = 0.0
            if result.get("segments") and len(result["segments"]) > 0:
                try:
                    duration = float(result["segments"][-1].get("end", 0.0))
                except Exception:
                    pass
            result["metrics"] = calculate_speaking_metrics(result["text"], duration)
            
            if sentiment:
                result["sentiment"] = analyze_sentiment(result["text"])
            if summarize:
                result["summary"] = summarize_text(result["text"])
            if action_items:
                result["action_items"] = extract_action_items(result["text"])
            if meeting_outline:
                result["meeting_outline"] = generate_meeting_outline(result["text"])
                
        return JSONResponse(content=result)
    finally:
        try:
            temp_path.unlink()
        except OSError:
            pass


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Received {len(data)} bytes")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/api/summary")
def api_summary(text: str):
    result = summarize_text(text)
    if result is None:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY is required for summarization.")
    return {"summary": result}


@app.post("/api/export")
async def api_export(
    text: str = Form(...),
    format: str = Form("txt"),
    segments: str = Form("[]"),
):
    import json as _json
    seg_data = _json.loads(segments) if segments else []
    fmt = format.lower()
    if fmt == "txt":
        return JSONResponse(content={"content": export_as_txt(text)})
    elif fmt == "srt":
        return JSONResponse(content={"content": export_as_srt(seg_data, text)})
    elif fmt == "vtt":
        return JSONResponse(content={"content": export_as_vtt(seg_data, text)})
    elif fmt == "docx":
        return Response(
            content=export_as_docx(text, seg_data),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=transcript.docx"},
        )
    elif fmt == "pdf":
        return Response(
            content=export_as_pdf(text, seg_data),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=transcript.pdf"},
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}.")


@app.post("/api/sentiment")
def api_sentiment(text: str = Form(...)):
    return {"sentiment": analyze_sentiment(text)}


@app.post("/api/format")
def api_format(text: str = Form(...)):
    return {"formatted": auto_format_text(text)}


@app.get("/api/settings")
def api_get_settings():
    return {
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "model": "whisper-1",
        "max_file_size_mb": 500,
    }


@app.post("/api/settings")
def api_save_api_key(key: str = Form(...)):
    os.environ["OPENAI_API_KEY"] = key
    return {"status": "ok", "message": "API key updated for this session."}
