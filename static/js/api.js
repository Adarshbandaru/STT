const API_ENDPOINT = "/api/transcribe";

export async function transcribeAudio(formData) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.detail || response.statusText || "Transcription failed.");
  }

  return response.json();
}
