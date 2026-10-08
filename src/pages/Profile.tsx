import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { UserCircle, Upload, CheckCircle2, FileText, Loader2, FileCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { extractFileContent } from '../lib/fileParser';
import { extractProfile } from '../lib/gemini';

export default function Profile() {
  const { apiKey, profileText, setProfileText } = useStore();
  const [text, setText] = useState(profileText);
  const [saved, setSaved] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [lastUploaded, setLastUploaded] = useState<{ name: string; type: string; chars: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setExtracting(true);
      setCurrentFileName(file.name);
      setErrorMsg('');

      try {
        const extracted = await extractFileContent(file);
        let contentToAdd = extracted.text || '';

        // If it's a PDF, Image, or Word doc, or if local text is short/empty,
        // trigger Gemini document extraction to get the real resume structure.
        const shouldUseAi =
          extracted.isPdf ||
          extracted.isImage ||
          !contentToAdd ||
          contentToAdd.length < 100;

        if (shouldUseAi && extracted.base64 && extracted.mimeType) {
          try {
            const aiText = await extractProfile(
              extracted.base64,
              extracted.mimeType,
              extracted.fileName,
              contentToAdd,
              apiKey
            );
            if (aiText && aiText.trim().length > 0) {
              contentToAdd = aiText.trim();
            }
          } catch (aiErr: any) {
            console.warn('AI extraction warning:', aiErr);
            // If we have local text, we can still fall back to it
            if (!contentToAdd || contentToAdd.trim().length === 0) {
              throw new Error(
                aiErr.message ||
                  `Could not extract text from "${file.name}". Please ensure your API key is configured or paste your text highlights below.`
              );
            }
          }
        }

        if (!contentToAdd || contentToAdd.trim().length === 0) {
          throw new Error(
            `No readable text was found in "${file.name}". Please paste your resume text directly below.`
          );
        }

        setText((prev) => {
          const trimmedPrev = prev.trim();
          // If previous text is empty or just generic brackets, replace cleanly
          if (!trimmedPrev || trimmedPrev.startsWith('[PDF Document:')) {
            return contentToAdd;
          }
          return `${trimmedPrev}\n\n---\n\n${contentToAdd}`;
        });

        setLastUploaded({
          name: extracted.fileName,
          type: extracted.fileType,
          chars: contentToAdd.length,
        });
      } catch (err: any) {
        console.error('File parsing error:', err);
        setErrorMsg(err?.message || 'Could not parse the selected file.');
      } finally {
        setExtracting(false);
        setCurrentFileName('');
      }
    },
    [apiKey]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    multiple: false,
  });

  const handleSave = () => {
    setProfileText(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        <div className="text-gray-500 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed space-y-1">
          <p>
            Upload your CV, resume, or portfolio highlights. You can also add any extra details, preferences, or context you consider important for your job search.
          </p>
          <p className="font-medium text-gray-600">
            CareerCompass uses this to evaluate fit.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-indigo-50/50 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Career History & Skills</h2>
              <p className="text-xs text-gray-400">Permanently saved in your local browser storage</p>
            </div>
          </div>
          {profileText.length > 0 && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Active Profile ({Math.round(profileText.trim().split(/\s+/).filter(Boolean).length).toLocaleString()} words)
              </span>
            </div>
          )}
        </div>

        {/* Selected Dropzone Element */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99] ring-4 ring-indigo-500/10'
              : 'border-violet-200/80 bg-gradient-to-b from-violet-50/30 via-white to-indigo-50/20 hover:border-indigo-400 hover:bg-violet-50/50'
          }`}
        >
          <input {...getInputProps()} />

          {extracting ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-700">
                  Extracting candidate profile from {currentFileName}...
                </p>
                <p className="text-xs text-indigo-500 mt-0.5">
                  AI is reading sections, skills, work history, and formatting
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs ring-4 ring-indigo-50/60">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-base font-semibold text-gray-800">
                  Drop your CV, Resume, or Portfolio here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Drag & drop or click to browse files from your computer
                </p>
              </div>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100/80">
                  PDF
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/80">
                  .DOC / .DOCX
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/80">
                  .TXT
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100/80">
                  .JPG / .PNG
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Upload feedback banner if file was processed */}
        {lastUploaded && !extracting && (
          <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/70 px-4 py-2.5 rounded-xl text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Extracted from <strong className="font-semibold">{lastUploaded.name}</strong>
              </span>
              <span className="bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                {lastUploaded.type}
              </span>
            </div>
            <span className="text-emerald-700 font-semibold">
              +{lastUploaded.chars.toLocaleString()} characters extracted
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Extraction Notice</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Extracted Profile Text & Highlights
            </span>
            <span className="text-xs text-gray-400 font-normal">
              Editable • Auto-included during evaluation
            </span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your resume text, accomplishments, and tech stack will appear here after uploading a file. You can also directly type or paste any additional details, preferences, or context you consider important for your job search..."
            className="w-full h-72 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none text-sm leading-relaxed font-mono"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow cursor-pointer"
        >
          {saved ? (
            <span>Saved successfully ✅</span>
          ) : (
            <span>Save profile 💾</span>
          )}
        </button>
      </motion.div>
    </div>
  );
}
