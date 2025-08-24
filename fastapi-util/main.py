from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Query
import os, requests, time, typing
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    CouldNotRetrieveTranscript,
)
from yt_dlp import YoutubeDL
import requests
import re
from typing import Optional, List
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import  ChatGoogleGenerativeAI


from dotenv import load_dotenv

load_dotenv()
# ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
if not ASSEMBLYAI_API_KEY:
   
    ASSEMBLYAI_API_KEY = None

if not GOOGLE_API_KEY:

    GOOGLE_API_KEY=None




# optional langchain splitter
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    _HAS_LANGCHAIN = True
except ImportError:
    RecursiveCharacterTextSplitter = None
    _HAS_LANGCHAIN = False

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev, allow all. In prod, restrict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Helpers
# -------------------------


def stream_file_to_assemblyai(file_obj, chunk_size: int = 5_242_880) -> str:
    """
    Stream a file-like object (binary) to AssemblyAI /v2/upload.
    Returns the upload_url returned by AssemblyAI.
    """
    upload_url = "https://api.assemblyai.com/v2/upload"
    headers = {"authorization": ASSEMBLYAI_API_KEY}

    def generator():
        while True:
            chunk = file_obj.read(chunk_size)
            if not chunk:
                break
            yield chunk

    resp = requests.post(upload_url, headers=headers, data=generator())
    try:
        resp.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Upload to AssemblyAI failed: {resp.status_code} {resp.text}") from e

    j = resp.json()
    return j["upload_url"]



def extract_yt_id(url_or_id: str) -> Optional[str]:
    """Extract YouTube video ID from URL or return if ID is passed."""
    if not url_or_id:
        return None
    m = re.search(r'(?:v=|youtu\.be/|/watch\?v=|/v/|/embed/)([A-Za-z0-9_-]{11})', url_or_id)
    if m:
        return m.group(1)
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', url_or_id):
        return url_or_id
    return None


def collapse_consecutive_repeated_phrases(text: str, max_phrase_words: int = 10, min_phrase_words: int = 2) -> str:
    tokens = text.split()
    if not tokens:
        return ""
    out_tokens = []
    i = 0
    N = len(tokens)
    while i < N:
        found_repeat = False
        for L in range(max_phrase_words, min_phrase_words - 1, -1):
            if i + L * 2 > N:
                continue
            reps = 1
            while i + L * (reps + 1) <= N and tokens[i:i + L] == tokens[i + L * reps:i + L * (reps + 1)]:
                reps += 1
            if reps > 1:
                out_tokens.extend(tokens[i:i + L])
                i += L * reps
                found_repeat = True
                break
        if not found_repeat:
            out_tokens.append(tokens[i])
            i += 1
    return " ".join(out_tokens)


def clean_transcript_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'(?i)webvtt[^\n]*\n?', " ", text)
    text = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}', " ", text)
    text = re.sub(r'<\d{2}:\d{2}:\d{2}\.\d{3}>', " ", text)
    text = re.sub(r'(?m)^\s*\d+\s*$', " ", text)
    text = re.sub(r'</?c[^>]*>', " ", text)
    text = re.sub(r'<[^>]+>', " ", text)
    text = re.sub(r'(?mi)^\s*(kind|language)\s*:\s*[^\n]+\n?', " ", text)
    text = re.sub(r'\d{2}:\d{2}:\d{2}', " ", text)
    text = re.sub(r'\b(?:align|position|region|vertical|line|size|voice)\s*:\s*\S+\b', " ", text, flags=re.IGNORECASE)
    text = re.sub(r'position:\s*\d+%', ' ', text, flags=re.IGNORECASE)
    text = text.replace('%', ' ')
    text = re.sub(r'&[a-zA-Z]+;', " ", text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = collapse_consecutive_repeated_phrases(text, max_phrase_words=10, min_phrase_words=2)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def vtt_to_plain_text(vtt_text: str) -> str:
    return clean_transcript_text(vtt_text)


def get_subs_with_ytdlp(vid: str, lang_pref: List[str]) -> Optional[str]:
    """Fallback: fetch subtitles via yt-dlp."""
    url = f"https://www.youtube.com/watch?v={vid}"
    ydl_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        return None

    requested = info.get("requested_subtitles") or {}
    automatic = info.get("automatic_captions") or {}

    def fetch_entry(entry):
        if not entry:
            return None
        if isinstance(entry, dict) and "url" in entry:
            try:
                r = requests.get(entry["url"], timeout=10)
                if r.status_code == 200 and r.text:
                    return vtt_to_plain_text(r.text)
            except requests.RequestException:
                return None
        if isinstance(entry, list) and entry and isinstance(entry[0], dict) and "url" in entry[0]:
            try:
                r = requests.get(entry[0]["url"], timeout=10)
                if r.status_code == 200 and r.text:
                    return vtt_to_plain_text(r.text)
            except requests.RequestException:
                return None
        return None

    for lang in lang_pref:
        entry = requested.get(lang)
        t = fetch_entry(entry)
        if t:
            return t

    for lang in lang_pref:
        entry = automatic.get(lang)
        t = fetch_entry(entry)
        if t:
            return t

    for entry in list(requested.values()) + list(automatic.values()):
        t = fetch_entry(entry)
        if t:
            return t

    return None


def chunk_text_simple(text: str, chunk_size: int = 50, overlap: int = 0) -> List[str]:
    if chunk_size <= 0:
        return [text]
    chunks = []
    step = max(1, chunk_size - overlap)
    i = 0
    L = len(text)
    while i < L:
        end = min(i + chunk_size, L)
        part = text[i:end].strip()
        if part:
            chunks.append(part)
        i += step
    return chunks


# -------------------------
# Endpoint
# -------------------------

@app.post("/youtube_transcript/")
async def youtube_transcript(request: Request,
                             languages: str = Query("en,hi", description="comma-separated language codes"),
                             chunk_size: int = Query(50),
                             chunk_overlap: int = Query(0)):
    """
    Accepts JSON: { "video": "<YouTube URL>" }
    Returns: { "transcript": [list of transcript chunks] }
    """
    try:
        body = await request.json()
        video_url = body.get("video")

        if not video_url:
            raise HTTPException(status_code=400, detail="Missing 'video' in request body")

        vid = extract_yt_id(video_url)
        if not vid:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL or ID")

        lang_list = [l.strip() for l in languages.split(",") if l.strip()]

        # Try youtube-transcript-api
        full_text = ""
        try:
            raw_transcript = YouTubeTranscriptApi.get_transcript(vid, languages=lang_list)
            full_text = " ".join(segment.get("text", "") for segment in raw_transcript).strip()
        except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, CouldNotRetrieveTranscript):
            full_text = ""
        except Exception:
            full_text = ""

        # Fallback: yt-dlp
        if not full_text:
            yd_text = get_subs_with_ytdlp(vid, lang_pref=lang_list)
            if yd_text:
                full_text = yd_text

        if not full_text:
            raise HTTPException(status_code=502, detail="Transcript could not be retrieved")

        full_text = clean_transcript_text(full_text)

        # Split into chunks
        if _HAS_LANGCHAIN and RecursiveCharacterTextSplitter is not None:
            try:
                splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
                docs = splitter.create_documents([full_text])
                transcript_list = [d.page_content for d in docs]
            except Exception:
                transcript_list = chunk_text_simple(full_text, chunk_size=chunk_size, overlap=chunk_overlap)
        else:
            transcript_list = chunk_text_simple(full_text, chunk_size=chunk_size, overlap=chunk_overlap)

        return {"transcript": transcript_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    









@app.post("/transcribe")
def transcribe(
    file: UploadFile = File(...),
    poll_interval: int = 3,
    timeout: int = 600,
) -> typing.Dict:
    """
    Accepts a file upload (video or audio), streams it to AssemblyAI,
    requests transcription using the 'universal' speech model, polls until
    completion, and returns the transcript JSON.

    Query params:
      - poll_interval: seconds between poll requests (default 3)
      - timeout: max seconds to wait for transcription (default 600)
    """
    if ASSEMBLYAI_API_KEY is None:
        raise HTTPException(status_code=500, detail="ASSEMBLYAI_API_KEY not configured on server.")

    # Optional: basic content-type check (allow video/* or audio/*)
    if not (file.content_type and (file.content_type.startswith("video/") or file.content_type.startswith("audio/"))):
        # not fatal — AssemblyAI accepts many types — but warn user
        raise HTTPException(status_code=400, detail=f"Unsupported content type: {file.content_type}. Send a video/audio file.")

    try:
        # Stream upload to AssemblyAI
        upload_url = stream_file_to_assemblyai(file.file)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected upload error: {str(e)}")

    # Create transcription job
    transcript_endpoint = "https://api.assemblyai.com/v2/transcript"
    headers = {"authorization": ASSEMBLYAI_API_KEY, "content-type": "application/json"}

    payload = {
        "audio_url": upload_url,
        "speech_model": "universal", 
    }

    try:
        r = requests.post(transcript_endpoint, json=payload, headers=headers)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to create transcription job: {r.text if 'r' in locals() else str(e)}")

    job = r.json()
    transcript_id = job.get("id")
    if not transcript_id:
        raise HTTPException(status_code=502, detail=f"Invalid response creating transcription job: {job}")

    polling_endpoint = transcript_endpoint + "/" + transcript_id

    # Polling loop
    start = time.time()
    while True:
        poll_resp = requests.get(polling_endpoint, headers=headers)
        if poll_resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Polling error: {poll_resp.status_code} {poll_resp.text}")

        poll_json = poll_resp.json()
        status = poll_json.get("status")

        if status == "completed":
            text=poll_json.get("text")
            splitter=RecursiveCharacterTextSplitter(chunk_size=50, chunk_overlap=0)
            chunks=splitter.create_documents([text])
            transcript_list=[]
            for i in chunks:
                transcript_list.append(i.page_content)

            return JSONResponse({"transcript": transcript_list})

        if status == "error":
            raise HTTPException(status_code=500, detail=f"Transcription failed: {poll_json.get('error')}")

        elapsed = time.time() - start
        if elapsed > timeout:
            raise HTTPException(status_code=504, detail=f"Transcription timed out after {timeout} seconds. Job id: {transcript_id}")

        time.sleep(poll_interval)

@app.post('/simlify/{text}')
def simplify(text):
    llm=ChatGoogleGenerativeAI(model="gemini-2.5-pro", api_key=GOOGLE_API_KEY, temperature=0.7)
    prompt=PromptTemplate(
        template="Simplify the text for the sign language to make it easy. Dont change the overall meaning just simplify the sentence construction. The language can be in any language. Return the simplification in the same language\\nText: {text}",
        input_variables=['text']
    )
    parser=StrOutputParser()

    chain=prompt|llm|parser

    output=chain.invoke({"text":text})
    return output
