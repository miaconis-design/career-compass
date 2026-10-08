import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { analyzeJob, JobAnalysis } from '../lib/gemini';
import { extractFileContent } from '../lib/fileParser';
import { useDropzone } from 'react-dropzone';
import { Upload, Link as LinkIcon, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, FileText, Image as ImageIcon, FileCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function EvaluateJob() {
  const { apiKey, profileText, addJob } = useStore();
  const navigate = useNavigate();
  const [jobText, setJobText] = useState('');
  const [jobMedia, setJobMedia] = useState<{ base64: string; mime: string; name: string; type: string } | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<JobAnalysis | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setExtracting(true);
    setError('');

    try {
      const extracted = await extractFileContent(file);

      if (extracted.isImage) {
        setJobMedia({
          base64: extracted.base64 || '',
          mime: extracted.mimeType || 'image/jpeg',
          name: extracted.fileName,
          type: extracted.fileType,
        });
        setJobText(''); // image takes visual priority
      } else if (extracted.isPdf) {
        // PDF can be passed multimodal or via extracted text
        setJobMedia({
          base64: extracted.base64 || '',
          mime: 'application/pdf',
          name: extracted.fileName,
          type: 'PDF',
        });
        if (extracted.text && !extracted.text.startsWith('[PDF Document:')) {
          setJobText(extracted.text);
        }
      } else {
        // Text or Word document (.docx, .doc, .txt)
        setJobMedia(null);
        setJobText(extracted.text);
      }
    } catch (err: any) {
      console.error('Error handling dropped file', err);
      setError('Could not process this file format.');
    } finally {
      setExtracting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Please set your Google Gemini API key in Settings first.');
      return;
    }
    if (!jobText && !jobMedia) {
      setError('Please drop a file (PDF, Doc, Image, or Text) or paste job details.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const analysis = await analyzeJob(
        apiKey,
        profileText,
        jobText,
        jobMedia?.base64,
        jobMedia?.mime
      );
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze job.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTracker = (status: 'Saved' | 'Applied' = 'Applied') => {
    if (!result) return;
    addJob({
      id: crypto.randomUUID(),
      company: result.company,
      jobTitle: result.jobTitle,
      matchPercentage: result.matchPercentage,
      verdict: result.verdict,
      sourceUrl,
      status,
      dateAdded: Date.now(),
      summaryBullets: result.summaryBullets,
      strengths: result.strengths,
      stretches: result.stretches,
      applicationAngles: result.applicationAngles,
      notes: '',
      files: [],
    });
    navigate('/tracker');
  };

  if (result) {
    return (
      <Scorecard 
        result={result} 
        sourceUrl={sourceUrl}
        onSaveForLater={() => handleSaveToTracker('Saved')}
        onTrackApplied={() => handleSaveToTracker('Applied')} 
        onReset={() => {
          setResult(null);
          setJobText('');
          setJobMedia(null);
          setSourceUrl('');
        }} 
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">Evaluate Job</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Drop a job posting screenshot, PDF, Word doc, or text to get instant AI analysis.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-2 rounded-3xl shadow-sm border border-indigo-50/50"
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99] ring-4 ring-indigo-500/10'
              : 'border-violet-200/80 bg-gradient-to-b from-violet-50/30 via-white to-indigo-50/20 hover:border-indigo-400 hover:bg-violet-50/50'
          }`}
        >
          <input {...getInputProps()} />

          {jobMedia ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs">
                {jobMedia.mime.startsWith('image/') ? (
                  <ImageIcon className="w-7 h-7" />
                ) : (
                  <FileCheck className="w-7 h-7" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{jobMedia.name}</span>
                <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {jobMedia.type}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJobMedia(null);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">Attached & ready for AI analysis • Click or drop to replace</p>
            </div>
          ) : extracting ? (
            <div className="py-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-600 animate-spin">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-indigo-700">Extracting document details...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs ring-4 ring-indigo-50/60">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">
                  Drop job screenshot, PDF, Word doc, or text here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Drag & drop or click to browse files
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

        <div className="px-6 py-6 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR PASTE TEXT</span>
            </div>
          </div>

          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder={jobMedia ? "Attached file loaded above. You can optionally add notes or extra text here..." : "Paste job description text here..."}
            className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none text-sm"
          />

          <div className="flex items-center gap-3 bg-gray-50 p-2 pl-4 rounded-xl border border-gray-100">
            <LinkIcon className="w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL (optional, to keep link to the posting)"
              className="flex-1 bg-transparent border-none focus:outline-none text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-xl text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Analyzing Job Profile...</span>
            ) : (
              <span>Analyze Job ✨</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Scorecard({ 
  result, 
  sourceUrl, 
  onSaveForLater, 
  onTrackApplied, 
  onReset 
}: { 
  result: JobAnalysis; 
  sourceUrl: string; 
  onSaveForLater: () => void; 
  onTrackApplied: () => void; 
  onReset: () => void; 
}) {
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'Strong Fit': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Stretch': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-rose-600 bg-rose-50 border-rose-200';
    }
  };

  const getMeterStyle = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-50/50">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{result.jobTitle}</h1>
            <div className="flex items-center gap-3">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                {result.company}
              </span>
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                  Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`text-5xl font-black tracking-tighter mb-2 ${getMeterStyle(result.matchPercentage)}`}>
              {result.matchPercentage}<span className="text-2xl text-gray-300">%</span>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getVerdictStyle(result.verdict)}`}>
              {result.verdict}
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/50 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">Role Snapshot</h3>
          <ul className="space-y-2">
            {result.summaryBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-indigo-900/80">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-800 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-amber-800 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              Stretches & Gaps
            </h3>
            <ul className="space-y-4">
              {result.stretches.map((stretch, i) => (
                <li key={i} className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">{stretch.gap}</div>
                  <div className="text-amber-700/80 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100/50 text-xs">
                    💡 {stretch.bridge}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-900 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Application Focus
          </h3>
          <ul className="space-y-3">
            {result.applicationAngles.map((angle, i) => (
              <li key={i} className="flex items-start gap-2 text-indigo-900/80">
                <ArrowRight className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                <span className="font-medium">{angle}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onSaveForLater}
              className="bg-white hover:bg-indigo-50/60 text-indigo-700 border-2 border-indigo-200 hover:border-indigo-400 font-bold py-3.5 px-5 rounded-xl text-base shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Save for later 📌
            </button>
            <button
              onClick={onTrackApplied}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3.5 px-5 rounded-xl text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Already applied 🚀
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onReset}
              className="px-5 py-2 rounded-lg font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
