import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker safely
if (typeof window !== 'undefined') {
  try {
    // Try local / unpkg worker matching exact version
    const version = pdfjsLib.version || '3.11.174';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Could not set pdf workerSrc', e);
  }
}

export interface ExtractedFileResult {
  fileName: string;
  fileType: string;
  text: string;
  base64?: string;
  mimeType?: string;
  isImage?: boolean;
  isPdf?: boolean;
}

/**
 * Extracts raw text and base64 from files (.pdf, .txt, .doc, .docx, .png, .jpg, .jpeg)
 */
export async function extractFileContent(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type || '';

  // 1. Text files (.txt, .md)
  if (extension === 'txt' || extension === 'md' || mimeType.startsWith('text/')) {
    const text = await file.text();
    const base64 = await fileToBase64(file);
    return {
      fileName,
      fileType: extension.toUpperCase(),
      text: text.trim(),
      base64,
      mimeType: 'text/plain',
    };
  }

  // 2. Word documents (.docx, .doc)
  if (extension === 'docx' || extension === 'doc' || mimeType.includes('word') || mimeType.includes('officedocument')) {
    let text = '';
    const base64 = await fileToBase64(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value.trim();
    } catch (err) {
      console.warn('Mammoth docx extraction notice:', err);
    }

    return {
      fileName,
      fileType: extension.toUpperCase(),
      text, // will trigger AI extraction if empty
      base64,
      mimeType: extension === 'doc' ? 'application/msword' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  // 3. PDF files (.pdf)
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    let extractedText = '';
    const base64 = await fileToBase64(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        disableFontFace: true,
      });
      const pdf = await loadingTask.promise;
      const textParts: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' ');
        if (pageText.trim()) {
          textParts.push(pageText.trim());
        }
      }
      extractedText = textParts.join('\n\n').trim();
    } catch (pdfErr) {
      console.warn('Local PDF text parsing skipped or failed, AI will extract:', pdfErr);
    }

    return {
      fileName,
      fileType: 'PDF',
      text: extractedText, // DO NOT default to "[PDF Document: filename]"
      base64,
      mimeType: 'application/pdf',
      isPdf: true,
    };
  }

  // 4. Image files (.jpg, .jpeg, .png, .webp)
  if (
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'png' ||
    extension === 'webp' ||
    mimeType.startsWith('image/')
  ) {
    const base64 = await fileToBase64(file);
    const resolvedMime = mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
    return {
      fileName,
      fileType: extension.toUpperCase(),
      text: '', // Images require OCR/AI extraction
      base64,
      mimeType: resolvedMime,
      isImage: true,
    };
  }

  // Generic fallback
  const text = await file.text().catch(() => '');
  const base64 = await fileToBase64(file);
  return {
    fileName,
    fileType: extension.toUpperCase(),
    text,
    base64,
    mimeType: file.type || 'application/octet-stream',
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
