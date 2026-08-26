# VedaAI Assessment Extraction & Answer Mapping

A teacher uploads a question paper and one student's handwritten answer sheet.
The app extracts every question (in printed order, sub-parts split out),
extracts and transcribes the student's answers, maps each answer to the
question it belongs to, highlights the exact region on the answer sheet when
a question is selected, and grades each answer with AI feedback.

## Live demo

- **App:** _fill in after deploying to Vercel_
- **API:** _fill in after deploying to Render_
- **Repo:** _fill in after pushing to GitHub_

## Approach

**Pipeline:** `Upload → Page normalization → Question extraction → Answer
extraction → Answer mapping → Grading`

1. **Page normalization.** Every uploaded file (PDF or image) is converted
   into a list of page images with PyMuPDF. Everything downstream only ever
   deals with page images, so PDFs and photographed answer sheets go through
   the exact same code path.
2. **Question extraction.** All question-paper pages are sent to a
   multimodal LLM in one call, with a prompt that requires: preserving the
   original printed numbering, splitting labelled sub-parts (`11 (a)`,
   `11 (b)`) into separate question entries, reading printed marks when
   present, and estimating a reasonable mark value when they aren't printed.
   The model also returns an approximate bounding box per question (used
   only for a possible future "question paper" highlight view - the
   assignment's highlighting requirement is on the *answer sheet* side).
3. **Answer extraction.** All answer-sheet pages are sent to the model in
   one call. It transcribes each handwritten block, records any label the
   student wrote (if any - many students don't label answers, or mislabel
   them), and returns a bounding box (or several, for answers spanning
   multiple pages) per answer block. Every block is kept, including ones
   that look like scratch work or don't match anything - the mapping step
   decides what to do with those.
4. **Answer mapping.** Questions and answers are passed to the model
   together (as text, not images, at this point) and it matches each
   question to its best answer block, using both the detected label and the
   semantic content - content is treated as the stronger signal, since
   students sometimes mislabel. Unmatched answers and unanswered questions
   are both explicit, first-class outcomes rather than something the UI has
   to infer.
5. **Grading.** All mapped question/answer pairs are graded in a single
   batched call (rather than one call per question) to stay comfortably
   within a free-tier rate limit. Each gets partial-credit marks, a
   correct/incorrect/partial flag, and short written feedback. Unanswered
   questions are graded 0 without an extra AI call.

**Why bounding boxes come straight from the vision model rather than a
separate OCR pass:** the alternative (e.g. Tesseract) is unreliable on
handwriting specifically - it's built for recognizing legible print, not
locating messy handwritten regions. A modern multimodal model is
reasonably good at *spatial grounding* (finding where something is) even
when it isn't perfect at transcribing every word, so asking it directly for
`{x, y, width, height}` alongside the transcription is the more robust
choice here, at the cost of the boxes being "close" rather than
pixel-perfect in every case.

**Edge cases explicitly handled:**
- Sub-parts (`11 (a)` / `11 (b)`) → separate question entries, per the spec.
- Marks printed on the paper are parsed; marks are estimated only when
  genuinely absent.
- Questions answered out of order → mapping is content-based, not
  position-based.
- Unanswered questions → shown as "Not answered", graded 0, not silently
  dropped.
- Answers that don't match any question → surfaced in an "Unmatched
  answers" section rather than hidden or force-matched.
- Answers spanning multiple pages → one answer block can carry multiple
  page/bbox entries; the viewer shows page-jump controls when that happens.

## AI model / API used

**Google Gemini 2.5 Flash**, via the free tier at
[aistudio.google.com](https://aistudio.google.com/apikey). Chosen because it
has a genuinely free tier with no billing/provisioning gate, handles
multi-page PDFs and images natively in one call, and returns structured
JSON reliably with `response_mime_type: "application/json"`.

The AI layer is behind a single adapter (`backend/app/ai_provider.py`), so
swapping to **Azure OpenAI** (`gpt-4o-mini` or similar) is a one-line env
var change (`AI_PROVIDER=azure_openai`) with no other code changes - useful
if you have Azure OpenAI access on a pay-as-you-go subscription.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** FastAPI (Python)
- **Storage:** in-memory only, per the assignment spec (no DB, no auth)
- **PDF/image handling:** PyMuPDF + Pillow

## Project structure

```
vedaai/
├── backend/
│   ├── app/
│   │   ├── main.py          FastAPI routes
│   │   ├── pipeline.py      extract -> map -> grade orchestration
│   │   ├── ai_provider.py   Gemini / Azure OpenAI adapter
│   │   ├── prompts.py       all prompt templates
│   │   ├── pdf_utils.py     PDF/image -> page images
│   │   ├── models.py        Pydantic schemas
│   │   └── storage.py       in-memory job store
│   ├── tests/test_pipeline.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/page.tsx         upload -> extracting -> mapping state machine
    ├── components/          Sidebar, TopBar, UploadScreen, QuestionList,
    │                        AnswerSheetViewer, MappingScreen, etc.
    └── lib/                 api client, shared types, grading helpers
```

## Running locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set GEMINI_API_KEY (get one free at https://aistudio.google.com/apikey)
uvicorn app.main:app --reload --port 8000
```

Run the tests (no API key needed - they use a fake AI provider):

```bash
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. The frontend expects the backend at
`http://localhost:8000` by default (see `NEXT_PUBLIC_API_BASE`).

## Deploying

**Backend → Render**
1. New Web Service → point at this repo, root directory `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env.example` (`AI_PROVIDER`,
   `GEMINI_API_KEY`, and set `ALLOWED_ORIGINS` to your deployed frontend URL).

**Frontend → Vercel**
1. New Project → point at this repo, root directory `frontend`.
2. Add environment variable `NEXT_PUBLIC_API_BASE` = your Render backend URL.
3. Deploy (Vercel auto-detects Next.js, no other config needed).

## Assumptions & limitations

- No database or auth, per the assignment spec - each job lives in server
  memory and is lost on restart. Fine for a single-teacher demo session,
  not for production multi-user use.
- Processing is synchronous: the upload request blocks until the full
  extract → map → grade pipeline finishes (the frontend shows the
  "Extracting…" screen for that duration). Simple and reliable for a demo;
  a production version would move this to a background job with polling or
  websockets.
- Bounding boxes come directly from the vision model's spatial grounding,
  not from a dedicated OCR engine - generally accurate but not
  pixel-perfect on every page, especially with cramped or overlapping
  handwriting.
- When marks aren't printed on the question paper, the max-marks value is
  an AI estimate, clearly labelled as such in the UI, not a real grading
  authority.
- Sidebar navigation items beyond "Exams" (Home, My Classroom, Assignments,
  My Library, Settings) are a cosmetic shell matching the Figma reference -
  only the upload → mapping flow is functional, per the assignment's actual
  scope.
- Tested against typed/rendered text and clear handwriting; very messy
  handwriting or low-quality photos will reduce transcription and mapping
  accuracy, as with any OCR/vision approach.
