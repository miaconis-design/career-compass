# CareerCompass 🧭

An AI-powered job search scorecard, resume analyzer, and application tracking system built with React 19, Tailwind CSS, Express, and Google Gemini.

---

## ✨ Features

- **Profile & Resume Extraction**: Upload your resume (PDF, Word doc, or screenshot) to automatically extract your skills, tenure, design/tech stack, and achievements.
- **Job Fit Scorecard**: Analyzes any job posting text or screenshot against your candidate profile:
  - Match percentage score & verdict (`Strong Fit`, `Stretch`, `Low Fit`)
  - **Comprehensive Role Snapshot** (4–5 high-value context points)
  - **Key Strengths** (4–6 concrete matches)
  - **Stretches & Framing Bridges** (actionable advice to pivot gaps)
  - **Application Focus** (tailored talking points for outreach and interviews)
  - **Clearance vs Citizenship Differentiation**: Intelligently distinguishes standard National Police Checks from Australian Citizenship / Security Clearance requirements.
- **Application Tracker**:
  - Interactive Kanban board (`Applied`, `Interviewing`, `Ghosted`, `Rejection`, `Offer`) with drag-and-drop.
  - **Full Analysis Breakdown**: Click any card to view the saved AI evaluation.
  - **Application Notes**: Add and save interview feedback, recruiter comments, and follow-up dates.
  - **File Attachments**: Upload custom cover letters, application answers (`.txt`), or tailored resumes with instant download.
- **Privacy-First**: Candidate profiles, tracked jobs, notes, and attachments are saved locally in the browser (`localStorage`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Zustand
- **Backend**: Express (Node.js/TypeScript)
- **AI Engine**: `@google/genai` (Google Gemini 3.1 Flash Lite / 3.8 Flash)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/career-compass.git
cd career-compass
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```
> You can get a free API key from [Google AI Studio](https://aistudio.google.com/).  
> *Note: You can also leave this empty and paste your API key directly into the app's in-browser **Settings** tab.*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

To build and run in production:
```bash
# Build the frontend assets
npm run build

# Start the full-stack server
npm run start
```
The application will serve the production bundle on port `3000` (or `PORT` environment variable if specified by your host).

---

## 🔒 Security & Privacy

- All sensitive API keys and environment files (`.env*`) are included in `.gitignore` to prevent committing them to version control.
- Resumes, job descriptions, notes, and file attachments remain on your local device via browser storage.
