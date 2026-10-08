import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function getGeminiClient(clientKey?: string) {
  const apiKey = clientKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY or paste your key in Settings.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Generate with automatic model fallback in case of 503/429 quota limits
async function generateWithFallback(ai: GoogleGenAI, params: any) {
  // Use gemini-3.1-flash-lite first to avoid exhausted 20/day free-tier quota on gemini-3.8-flash
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      const isQuota = err?.status === 429 || err?.message?.includes('Quota') || err?.message?.includes('429');
      if (isQuota) {
        console.log(`[AI] Model ${model} daily free-tier quota reached, falling back to alternate model...`);
      } else {
        console.warn(`[AI] Model ${model} notice:`, err?.message || err);
      }
      lastError = err;
    }
  }

  throw lastError;
}

// 1. API: Extract Profile from PDF, Image, or Document
app.post('/api/extract-profile', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, existingText } = req.body;
    const clientKey = req.headers['x-gemini-api-key'] as string | undefined;

    let ai;
    try {
      ai = getGeminiClient(clientKey);
    } catch (err: any) {
      if (existingText && existingText.trim().length > 0 && !existingText.startsWith('[PDF Document:')) {
        return res.json({ text: existingText });
      }
      return res.status(400).json({ error: err.message });
    }

    if (fileBase64 && mimeType) {
      const prompt = `You are a high-accuracy resume parser.
The attached file is a resume or CV document (Filename: "${fileName || 'Resume'}").
Extract ALL readable information completely and structure it clearly with sections:
- Candidate Name & Title
- Professional Summary / Bio
- Work Experience (Company, Role, Dates, Key responsibilities & metrics)
- Core Skills & Specialties (Design, Technical, Management)
- Tools & Software (e.g. Figma, Adobe CC, React, etc.)
- Education & Certifications
- Notable Projects & Portfolio links

Preserve exact details, numbers, and bullet points. Output ONLY the clean extracted profile text with clear headings, no markdown conversational preamble.`;

      const response = await generateWithFallback(ai, {
        contents: [
          prompt,
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
            },
          },
        ],
      });

      const extractedText = response.text || '';
      if (!extractedText.trim()) {
        if (existingText && existingText.trim().length > 0) {
          return res.json({ text: existingText });
        }
        return res.status(422).json({ error: 'AI could not read text from this document.' });
      }

      return res.json({ text: extractedText.trim() });
    } else if (existingText) {
      return res.json({ text: existingText });
    } else {
      return res.status(400).json({ error: 'No document data provided.' });
    }
  } catch (error: any) {
    console.error('Profile extraction error:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract profile information.' });
  }
});

// 2. API: Evaluate Job
app.post('/api/evaluate-job', async (req, res) => {
  try {
    const { profileText, jobText, jobMediaBase64, mediaMimeType } = req.body;
    const clientKey = req.headers['x-gemini-api-key'] as string | undefined;

    const ai = getGeminiClient(clientKey);

    const prompt = `You are an expert career coach and technical recruiter.
I will provide my candidate profile and a job description (text, document, or screenshot).
Analyze the match fit and extract rich, thorough, actionable details.

Candidate Profile:
${profileText || 'No candidate profile provided. Perform an objective role analysis with generic fit insights.'}

Job Description & Requirements:
${jobText || 'See attached job posting document or screenshot.'}

CRITICAL DEPTH & DETAIL REQUIREMENTS:
Provide a comprehensive, granular, in-depth analysis with abundant detail and substance to work with. Do NOT summarize too briefly or artificially truncate results.
- Summary Bullets: Provide at least 4 to 5 thorough snapshot points covering company mission/domain, day-to-day responsibilities, tech/design stack, team/org structure, and primary business impact.
- Strengths: Provide at least 4 to 6 detailed, concrete matches between the candidate's background and the role requirements (cite specific tools, experiences, leadership, domain knowledge, or deliverables from the candidate's profile).
- Stretches & Gaps: Provide at least 4 to 5 specific stretches, missing skills, unverified requirements, or domain gaps. For EVERY stretch, provide a realistic, tactical 1-2 sentence framing/bridging strategy explaining how the candidate can pivot, upskill, or pitch transferable skills.
- Application Focus: Provide at least 4 to 5 high-impact strategic talking points, tailored interview positioning angles, and compelling narrative hooks for an intro email or cover letter.
(Only provide fewer items if the job posting is extremely minimal and lacks sufficient text or context).

CRITICAL RULE - POLICE CLEARANCE VS AUSTRALIAN CITIZENSHIP DIFFERENTIATION:
You must strictly and explicitly differentiate between:
1. "Police Clearance / National Police Check / Criminal History Check": A standard criminal background verification that any candidate (including temporary visa holders and permanent residents) can obtain. Do NOT treat this as a citizenship restriction or security clearance barrier.
2. "Australian Citizenship / Security Clearance (Baseline, NV1, NV2, AGSVA)": Legally mandates Australian Citizenship. Non-citizens or visa holders cannot hold this clearance.
- NEVER conflate or lump together a Police Clearance with Australian Citizenship or Security Clearance.
- If the job posting asks for Australian Citizenship or AGSVA Security Clearance, explicitly specify "Australian Citizenship / Security Clearance Required" in the role summary and in stretches/gaps if the candidate profile does not clearly indicate citizenship.
- If the job posting asks for a Police Check / Clearance, explicitly label it as a "Standard National Police Check (routine background check, does not require citizenship)".

Provide a comprehensive, objective analysis of the job against my profile strictly matching the required JSON schema.`;

    const contents: any[] = [prompt];

    if (jobMediaBase64 && mediaMimeType) {
      contents.push({
        inlineData: {
          data: jobMediaBase64,
          mimeType: mediaMimeType,
        },
      });
    }

    const response = await generateWithFallback(ai, {
      contents,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING, description: "Auto-extracted company name (or 'Unknown Company')" },
            jobTitle: { type: Type.STRING, description: "Auto-extracted job title" },
            matchPercentage: { type: Type.INTEGER, description: 'Match score from 0 to 100' },
            verdict: { type: Type.STRING, enum: ['Strong Fit', 'Stretch', 'Low Fit'] },
            summaryBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 to 5 comprehensive bullet points: company mission, core responsibility, tech/tool stack, team scope, and primary mission',
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 to 6 detailed bullet points showing exact matches with the candidate profile, citing concrete skills, tools, and experiences',
            },
            stretches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  gap: { type: Type.STRING, description: 'The missing skill, unverified requirement, or experience stretch' },
                  bridge: { type: Type.STRING, description: 'Actionable 1-2 sentence advice on how to frame, pivot, or bridge this gap' },
                },
                required: ['gap', 'bridge'],
              },
              description: '4 to 5 detailed stretches or missing requirements, each with a practical 1-2 sentence bridge strategy',
            },
            applicationAngles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 to 5 actionable, high-impact strategic talking points and narrative angles for cover letters or interviews',
            },
          },
          required: [
            'company',
            'jobTitle',
            'matchPercentage',
            'verdict',
            'summaryBullets',
            'strengths',
            'stretches',
            'applicationAngles',
          ],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      return res.status(502).json({ error: 'Empty response from AI model.' });
    }

    const json = JSON.parse(outputText);
    return res.json(json);
  } catch (error: any) {
    console.error('Job evaluation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to evaluate job.' });
  }
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`CareerCompass server running on http://localhost:${PORT}`);
  });
}

startServer();
