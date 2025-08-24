# TranslateX

**TranslateX** — concise toolkit for bidirectional translation between signed and spoken languages (research prototype).

---

## Overview
TranslateX converts:
- **Signed → Spoken**: sign video (camera/upload) → pose & segmentation → gloss/signwriting → natural language text → TTS audio.  
- **Spoken → Signed**: audio/text → ASR/normalization → gloss → pose synthesis → skeleton/avatar video.

It is modular: swap pose estimators, recognition models, translation modules, TTS engines, and avatar renderers.

---

## Features
- Camera & upload support for sign videos.
- Pose estimation (2D/3D keypoints) and temporal segmentation.
- Sign recognition to gloss / SignWriting and natural-language translation.
- ASR and text normalization for spoken input.
- Gloss-to-pose synthesis and skeleton/avatar rendering.
- Simple REST API and demo frontend.
- Export results: text, audio (TTS), and video.

---

## Tech Stack
- **Backend**: Python, FastAPI (or Flask), Celery/RQ (optional)
- **ML**: PyTorch / TensorFlow, Transformers, OpenCV, MediaPipe / OpenPose
- **Audio**: FFmpeg, soundfile, TTS (gTTS, pyttsx3, or neural TTS)
- **Frontend**: React or Angular (demo UI)
- **Infrastructure**: Docker, docker-compose, GPU (optional)
- **Data**: RWTH-PHOENIX, MS-ASL, WLASL, ASLLVD (adapters)

---

## Project Pointers
- **Overview**: Lightweight, modular translation toolkit (signed↔spoken).
- **Primary modules**:
  - `frontend/` — demo UI (camera, upload, playback).
  - `backend/` — API, processing pipelines, model adapters.
  - `models/` — pre-trained weights and converters.
  - `data/` — dataset adapters & sample files.
  - `scripts/` — utils (frame extraction, preprocessing).
- **Key endpoints (examples)**:
  - `POST /translate/signed-to-spoken` — multipart video upload → returns text/audio.
  - `POST /translate/spoken-to-signed` — text/audio → returns synthesized sign video.

---

## Architecture (visual)
**Signed → Spoken**  
![Signed to Spoken Flow](./TranslateX_assets/583fb025-6cd3-487d-b9a7-b99b19e2babf.jpg)

**Spoken → Signed**  
![Spoken to Signed Flow](./TranslateX_assets/cd1b1656-689d-4783-977e-d9c8fc435802.jpg)

---

## Quickstart (minimal)
1. Clone:
```bash
git clone https://github.com/your-org/TranslateX.git
cd TranslateX
```
2. Setup:
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```
3. Start backend example:
```bash
uvicorn backend.translatex.api:app --reload --port 8000
```

---

## Folder layout (short)
```
backend/     # API, processors, model adapters
frontend/    # demo UI
models/      # weights & converters
data/        # datasets & samples
scripts/     # utilities
```

---

## Notes & Next steps
- Add production-ready model downloads (place weights in `models/`).
- Provide a small sample dataset in `data/examples/` for quick testing.
- Optional: include a simple FastAPI scaffold and demo React/Angular page.

---

## License & Contact
MIT License. Maintainer: Your Name — contact@example.com

--- 
(Attached architecture screenshots are copied into `TranslateX_assets/` alongside this README.)
