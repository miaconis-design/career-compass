import { GoogleGenAI, Type } from '@google/genai';

export interface JobAnalysis {
  company: string;
  jobTitle: string;
  matchPercentage: number;
  verdict: 'Strong Fit' | 'Stretch' | 'Low Fit';
  summaryBullets: string[];
  strengths: string[];
  stretches: { gap: string; bridge: string }[];
  applicationAngles: string[];
}

/**
 * Extracts candidate profile information from a document (PDF, Word, or Image).
 * Prioritizes the server-side API with Gemini 3.8 Flash, with client fallback.
 */
export async function extractProfile(
  fileBase64: string,
  mimeType: string,
  fileName: string,
  existingText?: string,
  clientApiKey?: string
): Promise<string> {
  // 1. Try server-side extraction
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (clientApiKey) {
      headers['x-gemini-api-key'] = clientApiKey;
    }

    const response = await fetch('/api/extract-profile', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileBase64,
        mimeType,
        fileName,
        existingText,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('Server extract-profile returned error:', response.status, errData);
    }
  } catch (serverErr) {
    console.warn('Server extract-profile fetch failed, checking fallback:', serverErr);
  }

  // 2. Client fallback with user API key if available
  if (clientApiKey && fileBase64 && mimeType) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const prompt = `You are a high-accuracy resume parser.
The attached file is a resume or CV document (Filename: "${fileName || 'Resume'}").
Extract ALL readable information completely and structure it clearly with sections:
- Candidate Name & Title
- Professional Summary / Bio
- Work Experience (Company, Role, Dates, Key responsibilities & metrics)
- Core Skills & Specialties
- Tools & Software (e.g. Figma, Adobe CC, React, etc.)
- Education & Certifications
- Notable Projects & Portfolio links

Output ONLY the clean extracted profile text with clear headings, no conversational preamble.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          prompt,
          {
            inlineData: {
              data: fileBase64,
              mimeType,
            },
          },
        ],
      });

      if (response.text?.trim()) {
        return response.text.trim();
      }
    } catch (clientErr) {
      console.error('Client-side Gemini extraction failed:', clientErr);
    }
  }

  // 3. Fallback to existing text if available
  if (existingText && existingText.trim().length > 0 && !existingText.startsWith('[PDF Document:')) {
    return existingText;
  }

  throw new Error('Could not automatically extract resume text. Please ensure your document is readable or paste your profile highlights directly.');
}

/**
 * Evaluates fit between candidate profile and job posting.
 * Calls server-side /api/evaluate-job with fallback to client-side GoogleGenAI.
 */
export async function analyzeJob(
  apiKey: string,
  profileText: string,
  jobText: string,
  jobMediaBase64?: string,
  mediaMimeType?: string
): Promise<JobAnalysis> {
  // 1. Try server-side API endpoint
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-gemini-api-key'] = apiKey;
    }

    const response = await fetch('/api/evaluate-job', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        profileText,
        jobText,
        jobMediaBase64,
        mediaMimeType,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result as JobAnalysis;
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('Server evaluate-job returned error:', response.status, errData);
      if (errData.error && !apiKey) {
        throw new Error(errData.error);
      }
    }
  } catch (err: any) {
    console.warn('Server evaluation call failed, checking client fallback:', err);
    if (!apiKey) {
      throw err;
    }
  }

  // 2. Client-side fallback if user provided direct key
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert career coach and technical recruiter.
I will provide my candidate profile and a job description (text, document, or screenshot).
Analyze the match fit and extract rich, thorough, actionable details.

Candidate Profile:
${profileText || 'No candidate profile provided. Assume general analysis.'}

Job Details:
${jobText || 'See attached document/image.'}

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

Provide a comprehensive, objective analysis of the job against my profile in the requested JSON structure.`;

    const contents: any[] = [prompt];

    if (jobMediaBase64 && mediaMimeType) {
      contents.push({
        inlineData: {
          data: jobMediaBase64,
          mimeType: mediaMimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING, description: "Auto-extracted company name (or 'Unknown Company')" },
            jobTitle: { type: Type.STRING, description: 'Auto-extracted job title' },
            matchPercentage: { type: Type.INTEGER, description: 'Fit score out of 100' },
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

    const text = response.text;
    if (!text) {
      throw new Error('No response from AI model');
    }

    return JSON.parse(text) as JobAnalysis;
  }

  throw new Error('Failed to evaluate job. Please check your network connection or provide an API key in Settings.');
}
